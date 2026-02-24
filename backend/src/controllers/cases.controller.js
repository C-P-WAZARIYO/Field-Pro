/**
 * Export visited cases with all feedback fields as CSV or Excel
 * GET /api/cases/visited/export?format=csv|excel&month=&year=&bank=&product=&bkt=&limit=&offset=
 */
const exportVisitedCases = async (req, res) => {
  try {
    const { month, year, bank, product, bkt, limit, offset, format } = req.query;
    const filters = {};
    if (month) filters.month = parseInt(month);
    if (year) filters.year = parseInt(year);
    if (bank) filters.bank = bank;
    if (product) filters.product = product;
    if (bkt) filters.bkt = bkt;
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    const result = await caseService.getVisitedCases(filters);
    const rows = [];
    result.cases.forEach(c => {
      (c.feedbacks || []).forEach(fb => {
        // Extract relation, metName, place, and visit observation
        let whoMet = '';
        let nameOfPersonMet = '';
        let meetingPlace = '';
        let visitObservation = '';

        // Try to get relation and metName from feedback (if present)
        // Fallbacks: if whoMet is Customer, use customer name, else use metName
        if (fb.relation && fb.metName) {
          whoMet = fb.relation;
          nameOfPersonMet = fb.metName;
        } else if (fb.whoMet && fb.whoMet === 'Customer') {
          whoMet = 'Customer';
          nameOfPersonMet = c.customer_name || '';
        } else if (fb.metName) {
          whoMet = fb.whoMet || '';
          nameOfPersonMet = fb.metName;
        } else {
          whoMet = fb.whoMet || '';
          nameOfPersonMet = c.customer_name || '';
        }

        meetingPlace = fb.meeting_place || fb.place || '';
        visitObservation = fb.remarks || fb.fullFeedback || '';

        rows.push({
          AccountID: c.acc_id,
          CustomerName: c.customer_name,
          Bank: c.bank_name,
          Product: c.product_type || fb.product_type || '',
          BKT: c.bkt,
          WhoMet: whoMet,
          NameOfPersonMet: nameOfPersonMet,
          MeetingPlace: meetingPlace,
          VisitObservation: visitObservation,
          ExecutiveName: fb.executive ? `${fb.executive.firstName} ${fb.executive.lastName}` : '',
          ExecutiveEmpID: fb.executive?.emp_id || '',
          VisitCode: fb.visit_code,
          AssetStatus: fb.asset_status,
          PhotoURL: fb.photo_url,
          Latitude: fb.lat,
          Longitude: fb.lng,
          PTPDate: fb.ptp_date ? fb.ptp_date.toISOString() : '',
          IsFakeVisit: fb.is_fake_visit,
          DistanceFromAddress: typeof fb.distance_from_address === 'number' ? fb.distance_from_address : (fb.distance || ''),
          DeviceInfo: fb.device_info ? JSON.stringify(fb.device_info) : '',
          PTPBroken: fb.ptp_broken,
          FakeVisitReason: fb.fake_visit_reason || '',
          Status: fb.status || 'Visited',
          CreatedAt: fb.createdAt ? fb.createdAt.toISOString() : '',
          UpdatedAt: fb.updatedAt ? fb.updatedAt.toISOString() : '',
        });
      });
    });
    const xlsx = require('xlsx');
    let fileBuffer, fileName, mimeType;
    const exportFormat = format === 'excel' ? 'excel' : 'csv';
    if (exportFormat === 'excel') {
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'VisitedCases');
      fileBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      fileName = `visited_cases_${Date.now()}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      const ws = xlsx.utils.json_to_sheet(rows);
      const csv = xlsx.utils.sheet_to_csv(ws);
      fileBuffer = Buffer.from(csv);
      fileName = `visited_cases_${Date.now()}.csv`;
      mimeType = 'text/csv';
    }
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error exporting visited cases:', error);
    res.status(500).json({ success: false, message: 'Failed to export visited cases' });
  }
};
/**
 * Case Controller
 * Handles case management endpoints
 */

const { body, validationResult, query } = require('express-validator');
const caseService = require('../services/case.service');
const feedbackService = require('../services/feedback.service');
const payoutService = require('../services/payout.service');
const xlsx = require('xlsx');
const multer = require('multer');
const crypto = require('crypto');
const prisma = require('../config/database');

// multer memory storage
const uploadMiddleware = multer({ storage: multer.memoryStorage() });

/**
 * Upload Excel and bulk create cases (Supervisor)
 * POST /api/cases/upload
 */
const uploadCases = async (req, res) => {
  try {
    // multer puts file in req.file when used as middleware
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const buffer = req.file.buffer;

    // Encrypt and save original file (if key provided)
    const encKey = process.env.UPLOAD_ENC_KEY || null; // must be 32 bytes for aes-256
    let savedFilename = null;
    if (encKey) {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encKey, 'hex'), iv);
      const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
      const out = Buffer.concat([iv, encrypted]);
      const filename = `uploads/upload_${Date.now()}.enc`;
      const fs = require('fs');
      fs.mkdirSync('uploads', { recursive: true });
      fs.writeFileSync(filename, out);
      savedFilename = filename;
    }
    
      // Audit log: Excel file uploaded
      const auditService = require('../services/audit.service');
      await auditService.log({
        userId: req.user?.id,
        action: 'EXCEL_UPLOAD',
        resource: 'caseUpload',
        details: { filename: savedFilename || 'memory', originalname: req.file.originalname },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

    // Parse excel using xlsx
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    // Normalize all row keys to remove spaces (trim keys)
    const normalizedRows = rows.map(row => {
      const normalizedRow = {};
      for (const [key, value] of Object.entries(row)) {
        normalizedRow[key.trim()] = value;
      }
      return normalizedRow;
    });

    // Extract all unique emp_ids for batch lookup
    const empIds = [...new Set(normalizedRows.map(r => {
      const id = r['Emp_ID'] || r['emp_id'] || r['Emp_id'] || r['EMP_ID'] || r['emp id'] || r['Emp ID'];
      return id ? String(id).trim() : null;
    }).filter(Boolean))];
    
    console.log(`🔍 Looking up ${empIds.length} unique employee IDs...`);
    
    // Batch lookup all employees at once (NOT 20k individual queries!)
    const empIdToUserId = {};
    const foundEmpIds = [];
    const notFoundEmpIds = [];
    
    if (empIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { emp_id: { in: empIds } },
        select: { id: true, emp_id: true, firstName: true, lastName: true },
      });
      users.forEach(u => {
        empIdToUserId[u.emp_id.trim()] = u.id;
        foundEmpIds.push({ emp_id: u.emp_id, name: `${u.firstName} ${u.lastName}` });
      });
      
      // Track which emp_ids were NOT found
      empIds.forEach(id => {
        if (!empIdToUserId[id]) {
          notFoundEmpIds.push(id);
        }
      });
    }

    console.log(`✅ Found ${foundEmpIds.length} employees in database`);
    if (notFoundEmpIds.length > 0) {
      console.log(`⚠️  ${notFoundEmpIds.length} employees NOT found in database: ${notFoundEmpIds.join(', ')}`);
    }

    // Map rows to case objects
    const casesArray = [];
    const skippedRows = [];
    
    for (let i = 0; i < normalizedRows.length; i++) {
      const r = normalizedRows[i];
      // Normalize keys (common variants - CASE SENSITIVE!)
      const acc_no = r['Acc_No'] || r['Acc_no'] || r['Acc No'] || r['Account'] || r['acc_no'] || r['acc_id'] || r['Acc ID'] || r['ACC_NO'] || r['Account_No'];
      
      if (!acc_no) {
        skippedRows.push({ rowNumber: i + 2, reason: `Missing Account Number. Row keys: ${Object.keys(r).join(', ')}` });
        continue; // skip invalid rows
      }

      const empId = r['Emp_ID'] || r['emp_id'] || r['Emp_id'] || r['EMP_ID'] || r['emp id'] || r['Emp ID'] || r['emp_id'];
      const empIdTrimmed = empId ? String(empId).trim() : null;
      const executiveId = empIdTrimmed ? empIdToUserId[empIdTrimmed] : null;

      const caseObj = {
        acc_id: String(acc_no).trim(),
        cust_id: r['cust_id'] ? String(r['cust_id']).trim() : null,
        customer_name: r['Acc_holder_name'] || r['Acc_Holder_Name'] || r['Account Holder Name'] || r['Name'] || r['acc_holder_name'] || '',
        phone_number: r['phone_number'] || r['Phone_number'] || r['Phone'] || r['phone'] ? String(r['phone_number'] || r['Phone_number'] || r['Phone'] || r['phone']) : null,
        address: r['Acc_holder_address'] || r['Acc_Holder_Address'] || r['Address'] || r['acc_holder_address'] || '',
        pincode: r['pincode'] || r['Pincode'] ? String(r['pincode'] || r['Pincode']).trim() : null,
        lat: r['lat'] ? parseFloat(r['lat']) : null,
        lng: r['lng'] ? parseFloat(r['lng']) : null,
        bank_name: r['Bank_name'] || r['Bank name'] || r['Bank'] || r['bank_name'] ? String(r['Bank_name'] || r['Bank name'] || r['Bank'] || r['bank_name']).trim() : '',
        product_type: r['Product_name'] || r['product name'] || r['Product'] || r['product_name'] ? String(r['Product_name'] || r['product name'] || r['Product'] || r['product_name']).trim() : '',
        sub_product_name: r['Sub_product_name'] || r['sub_product_name'] || r['Sub_Product_Name'] ? String(r['Sub_product_name'] || r['sub_product_name'] || r['Sub_Product_Name']).trim() : null,
        bkt: r['BKT'] || r['bkt'] || r['Bkt'] ? String(r['BKT'] || r['bkt'] || r['Bkt']).trim() : null,
        priority: r['Importance'] || r['importance'] || r['priority'] ? String(r['Importance'] || r['importance'] || r['priority']).trim() : '',
        pos_amount: parseFloat(r['POS_amount'] || r['pos amount'] || r['Pos amount'] || r['pos_amount'] || r['POS_Amount'] || 0) || 0,
        overdue_amount: parseFloat(r['Total_due_amount'] || r['overdue_amount'] || r['Overdue Amount'] || r['overdue amount'] || r['Total_Due_Amount'] || 0) || 0,
        dpd: parseInt(r['DPD'] || r['dpd'] || r['Dpd'] || 0) || 0,
        npa_status: r['NPA_status'] || r['npa status'] || r['NPA Status'] || r['npa_status'] || r['NPA_Status'] ? String(r['NPA_status'] || r['npa status'] || r['NPA Status'] || r['npa_status'] || r['NPA_Status']).trim() : null,
        performance: r['Performance (Flow/Stab/Norm/RB)'] || r['Performance'] || r['performance'] ? String(r['Performance (Flow/Stab/Norm/RB)'] || r['Performance'] || r['performance']).trim() : null,
        collection_amount: parseFloat(r['Collection_amount'] || r['collection_amount'] || r['Collection amount'] || r['Collection_Amount'] || 0) || 0,
        toss_amount: parseFloat(r['Toss_amount'] || r['toss_amount'] || r['Toss amount'] || r['Toss_Amount'] || 0) || 0,
        emi_amount: parseFloat(r['EMI_amount'] || r['emi_amount'] || r['EMI amount'] || r['EMI_Amount'] || 0) || 0,
        interest: parseFloat(r['Interest'] || r['interest'] || 0) || 0,
        emp_id: empIdTrimmed || null,
        executiveId,
        upload_mode: 'ORIGINAL',
      };
      casesArray.push(caseObj);
      
        // Audit log: case row processed
        await auditService.log({
          userId: req.user?.id,
          action: 'CASE_ROW_PROCESSED',
          resource: 'case',
          details: { acc_id: caseObj.acc_id, emp_id: caseObj.emp_id, executiveId: caseObj.executiveId },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
    }

    if (skippedRows.length > 0) {
      console.log(`⚠️  Skipped ${skippedRows.length} invalid rows:`);
      skippedRows.forEach(skip => {
        console.log(`   Row ${skip.rowNumber}: ${skip.reason}`);
      });
    }

    // Create cases in bulk with batch processing
    const supervisorId = req.user?.id || null;
    const result = await caseService.bulkCreateCases(casesArray, supervisorId, 'ORIGINAL');

    // Count allocation stats
    const allocationStats = {
      total: result.cases.length,
      allocated: result.cases.filter(c => c.executiveId).length,
      unallocated: result.cases.filter(c => !c.executiveId).length,
      foundEmployees: foundEmpIds.length,
      notFoundEmployees: notFoundEmpIds.length,
      notFoundEmpIds: notFoundEmpIds,
    };

    console.log(`📊 Allocation Summary:
    Total Cases: ${allocationStats.total}
    Allocated: ${allocationStats.allocated}
    Unallocated: ${allocationStats.unallocated}
    Found Employees: ${allocationStats.foundEmployees}
    Not Found Employees: ${allocationStats.notFoundEmployees}`);

    // Check ACR per executive (count cases per executiveId or emp_id)
    const counts = {};
    for (const c of result.cases) {
      const key = c.executiveId || c.emp_id || 'unassigned';
      counts[key] = (counts[key] || 0) + 1;
    }
    const overloaded = Object.entries(counts).filter(([k, v]) => v > 100).map(([k, v]) => ({ id: k, count: v }));

    res.status(201).json({ 
      success: true, 
      data: { 
        upload: result.upload, 
        created: result.cases.length,
        totalRows: normalizedRows.length,
        skippedRows: skippedRows.length,
        skippedRowDetails: skippedRows.length > 0 ? skippedRows : null,
        allocationStats,
        overloaded, 
        savedFilename,
        notFoundEmpIds: notFoundEmpIds.length > 0 ? notFoundEmpIds : null,
      },
      message: `Uploaded ${result.cases.length}/${normalizedRows.length} cases. ${skippedRows.length > 0 ? `Skipped ${skippedRows.length} rows.` : ''} Allocated: ${allocationStats.allocated}, Unallocated: ${allocationStats.unallocated}`
    });
  } catch (error) {
    console.error('Upload cases failed', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a single case
 * POST /api/cases
 */
const createCase = async (req, res) => {
  try {
    const { acc_id, customer_name, pos_amount, bkt, product_type, bank_name, emp_id } = req.body;

    const caseRecord = await caseService.createCase({
      acc_id,
      customer_name,
      pos_amount,
      bkt,
      product_type,
      bank_name,
      emp_id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });

    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      data: caseRecord,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get cases for executive
 * GET /api/cases/executive/:executiveId
 */
const getCasesForExecutive = async (req, res) => {
  try {
    const { executiveId } = req.params;
    const { bkt, product_type, npa_status, priority, status } = req.query;

    const filters = {};
    if (bkt) filters.bkt = bkt;
    if (product_type) filters.product_type = product_type;
    if (npa_status) filters.npa_status = npa_status;
    if (priority) filters.priority = priority;
    if (status) filters.status = status;

    const cases = await caseService.getCasesForExecutive(executiveId, filters);

    res.status(200).json({
      success: true,
      data: cases,
      total: cases.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get single case with all feedbacks
 * GET /api/cases/:caseId
 */
const getCaseById = async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseRecord = await caseService.getCaseById(caseId);

    if (!caseRecord) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
      });
    }

    res.status(200).json({
      success: true,
      data: caseRecord,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get performance summary for executive
 * GET /api/cases/performance/:executiveId
 */
const getPerformance = async (req, res) => {
  try {
    const { executiveId } = req.params;
    const { month, year, bank, product, bkt } = req.query;

    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const filters = { month: currentMonth, year: currentYear, bank, product, bkt };

    const performance = await caseService.getExecutivePerformance(executiveId, filters);

    res.status(200).json({
      success: true,
      data: performance,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get leaderboard / ranking of executives
 * GET /api/cases/leaderboard?month=&year=
 */
const getLeaderboard = async (req, res) => {
  try {
    const { month, year } = req.query;
    const user = req.user; // from authenticate middleware

    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const leaderboard = await caseService.getLeaderboard(user, currentMonth, currentYear);

    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get all cases (with filters) - for Supervisor
 * GET /api/cases
 */
const getAllCases = async (req, res) => {
  try {
    const { status, bkt, product_type, month, year, bank_name, limit, offset } = req.query;

    const filters = {
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    };

    if (status) filters.status = status;
    if (bkt) filters.bkt = bkt;
    if (product_type) filters.product_type = product_type;
    if (month) filters.month = parseInt(month);
    if (year) filters.year = parseInt(year);
    if (bank_name) filters.bank_name = bank_name;

    const result = await caseService.getAllCases(filters);

    res.status(200).json({
      success: true,
      data: result.cases,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get case by account id (acc_id)
 * GET /api/cases/lookup?acc_id=ACC123
 */
const getCaseByAccId = async (req, res) => {
  try {
    const { acc_id } = req.query;
    if (!acc_id) {
      return res.status(400).json({ success: false, message: 'Missing acc_id query parameter' });
    }

    const caseRecord = await caseService.getCaseByAccId(acc_id);
    if (!caseRecord) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    res.status(200).json({ success: true, data: caseRecord });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Allocate cases to executive
 * POST /api/cases/allocate
 */
const allocateCases = async (req, res) => {
  try {
    const { emp_id, executiveId } = req.body;

    const result = await caseService.allocateCasesToExecutive(emp_id, executiveId);

    res.status(200).json({
      success: true,
      message: `${result.count} cases allocated`,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Bulk allocate cases
 * POST /api/cases/allocate/bulk
 */
const bulkAllocate = async (req, res) => {
  try {
    const { allocations } = req.body; // [{ emp_id, executiveId }, ...]

    const results = await caseService.bulkAllocateCases(allocations);

    res.status(200).json({
      success: true,
      message: 'Bulk allocation completed',
      data: results,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Allocate cases by emp_id to an executive
 * POST /api/cases/allocate-by-empid
 */
const allocateByEmpId = async (req, res) => {
  try {
    const { emp_id, executiveId } = req.body;
    
    if (!emp_id || !executiveId) {
      return res.status(400).json({ success: false, message: 'emp_id and executiveId are required' });
    }

    // Verify the executive exists
    const executive = await prisma.user.findUnique({
      where: { id: executiveId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!executive) {
      return res.status(404).json({ success: false, message: 'Executive not found' });
    }

    // Update all cases with this emp_id to be assigned to this executive
    const result = await prisma.case.updateMany({
      where: { emp_id, executiveId: null }, // Only unallocated cases
      data: { executiveId },
    });

    res.status(200).json({
      success: true,
      message: `Allocated ${result.count} cases from emp_id: ${emp_id} to ${executive.firstName} ${executive.lastName}`,
      data: {
        emp_id,
        executiveId,
        executiveName: `${executive.firstName} ${executive.lastName}`,
        casesAllocated: result.count,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get allocation status for an upload
 * GET /api/cases/allocation-status
 */
const getAllocationStatus = async (req, res) => {
  try {
    const allocated = await prisma.case.count({ where: { executiveId: { not: null } } });
    const unallocated = await prisma.case.count({ where: { executiveId: null } });
    const total = allocated + unallocated;

    // Get unallocated emp_ids
    const unallocatedByEmpId = await prisma.case.groupBy({
      by: ['emp_id'],
      where: { executiveId: null },
      _count: { id: true },
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        allocated,
        unallocated,
        unallocatedByEmpId: unallocatedByEmpId.map(item => ({
          emp_id: item.emp_id,
          count: item._count.id,
        })),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get visited cases with feedbacks and visit counts
 * GET /api/cases/visited?month=&year=&bank=&product=&bkt=&limit=&offset=
 */
const getVisitedCases = async (req, res) => {
  try {
    const { month, year, bank, product, bkt, limit, offset } = req.query;
    const filters = {};
    if (month) filters.month = parseInt(month);
    if (year) filters.year = parseInt(year);
    if (bank) filters.bank = bank;
    if (product) filters.product = product;
    if (bkt) filters.bkt = bkt;
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    const result = await caseService.getVisitedCases(filters);

    res.status(200).json({ success: true, data: result.cases, total: result.total, pagination: { limit: result.limit, offset: result.offset } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Preview uploaded Excel files (Manager/Admin)
const fs = require('fs');
const path = require('path');
const auditService = require('../services/audit.service');

const getUploadedFiles = async (req, res) => {
  try {
    const uploads = await prisma.caseUpload.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.status(200).json({ success: true, data: uploads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadUploadedFile = async (req, res) => {
  try {
    const { uploadId } = req.params;
    const upload = await prisma.caseUpload.findUnique({ where: { id: uploadId } });
    if (!upload || !upload.filename) return res.status(404).json({ success: false, message: 'File not found' });
    const filePath = path.resolve('uploads', upload.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found' });
    res.download(filePath, upload.filename);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUploadAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const logs = await auditService.getAllLogs({ action: 'EXCEL_UPLOAD', page: parseInt(page), limit: parseInt(limit) });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCase,
  getCasesForExecutive,
  getCaseById,
  getPerformance,
  getAllCases,
  allocateCases,
  bulkAllocate,
  getCaseByAccId,
  uploadCases,
  allocateByEmpId,
  getAllocationStatus,
  getLeaderboard,
  getVisitedCases,
  exportVisitedCases,
  getUploadedFiles,
  downloadUploadedFile,
  getUploadAuditLogs,
};
