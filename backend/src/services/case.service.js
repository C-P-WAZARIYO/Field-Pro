/**
 * Case Service
 * Handles case management, upload, allocation, and performance tracking
 */

const prisma = require('../config/database');

/**
 * Create a single case
 */
const createCase = async (caseData) => {
  try {
    const caseRecord = await prisma.case.create({
      data: {
        acc_id: caseData.acc_id,
        cust_id: caseData.cust_id,
        customer_name: caseData.customer_name,
        phone_number: caseData.phone_number,
        address: caseData.address,
        pincode: caseData.pincode,
        lat: caseData.lat,
        lng: caseData.lng,
        pos_amount: caseData.pos_amount || 0,
        overdue_amount: caseData.overdue_amount || 0,
        dpd: caseData.dpd || 0,
        bkt: caseData.bkt,
        product_type: caseData.product_type,
        bank_name: caseData.bank_name,
        npa_status: caseData.npa_status,
        priority: caseData.priority,
        emp_id: caseData.emp_id,
        executiveId: caseData.executiveId || null,
        month: caseData.month || new Date().getMonth() + 1,
        year: caseData.year || new Date().getFullYear(),
        upload_mode: caseData.upload_mode || 'ORIGINAL',
      },
    });
    return caseRecord;
  } catch (error) {
    throw new Error(`Failed to create case: ${error.message}`);
  }
};

/**
 * Bulk create cases from Excel upload
 */
/**
 * Bulk create cases from Excel upload - OPTIMIZED for 20k+ rows
 */
/**
 * Bulk create cases from Excel upload - OPTIMIZED for 20k+ rows
 */
const bulkCreateCases = async (casesArray, supervisorId, uploadMode = 'ORIGINAL') => {
  try {
    // 1. Create upload record
    const upload = await prisma.caseUpload.create({
      data: {
        supervisorId,
        filename: `upload_${Date.now()}`,
        upload_mode: uploadMode,
        total_cases: casesArray.length,
      },
    });

    // 2. Fetch all Executives to map emp_id to the real executiveId (UUID)
    // Adjust the `where` clause if your User model identifies executives differently
    // 2. Fetch all Executives to map emp_id to the real executiveId (UUID)
    const executives = await prisma.user.findMany({
      where: {
        // Since only executives/employees have an emp_id, we just fetch users where emp_id is not null!
        emp_id: {
          not: null,
        }
      },
      select: { id: true, emp_id: true }
    });

    // Create a dictionary for instant lookups (e.g., { "EXE001": "5eac5..." })
    const employeeMap = {};
    executives.forEach(exec => {
      if (exec.emp_id) {
        employeeMap[exec.emp_id] = exec.id;
      }
    });


    // 3. Upsert (update or insert) each case by acc_id
    const BATCH_SIZE = 100; // Reduce batch size for upserts
    for (let i = 0; i < casesArray.length; i += BATCH_SIZE) {
      const batch = casesArray.slice(i, i + BATCH_SIZE);
      const upsertPromises = batch.map(async (caseData) => {
        // Look up the real UUID based on the string in the Excel file
        const realExecutiveId = employeeMap[caseData.emp_id] || null;
        return prisma.case.upsert({
          where: { acc_id: caseData.acc_id },
          update: {
            cust_id: caseData.cust_id,
            customer_name: caseData.customer_name,
            phone_number: caseData.phone_number,
            address: caseData.address,
            pincode: caseData.pincode,
            lat: caseData.lat,
            lng: caseData.lng,
            pos_amount: caseData.pos_amount || 0,
            overdue_amount: caseData.overdue_amount || 0,
            dpd: caseData.dpd || 0,
            bkt: caseData.bkt,
            product_type: caseData.product_type,
            sub_product_name: caseData.sub_product_name,
            bank_name: caseData.bank_name,
            npa_status: caseData.npa_status,
            priority: caseData.priority,
            performance: caseData.performance,
            collection_amount: caseData.collection_amount || 0,
            toss_amount: caseData.toss_amount || 0,
            emi_amount: caseData.emi_amount || 0,
            interest: caseData.interest || 0,
            emp_id: caseData.emp_id,
            executiveId: realExecutiveId,
            month: caseData.month || new Date().getMonth() + 1,
            year: caseData.year || new Date().getFullYear(),
            upload_mode: caseData.upload_mode || 'ORIGINAL',
          },
          create: {
            acc_id: caseData.acc_id,
            cust_id: caseData.cust_id,
            customer_name: caseData.customer_name,
            phone_number: caseData.phone_number,
            address: caseData.address,
            pincode: caseData.pincode,
            lat: caseData.lat,
            lng: caseData.lng,
            pos_amount: caseData.pos_amount || 0,
            overdue_amount: caseData.overdue_amount || 0,
            dpd: caseData.dpd || 0,
            bkt: caseData.bkt,
            product_type: caseData.product_type,
            sub_product_name: caseData.sub_product_name,
            bank_name: caseData.bank_name,
            npa_status: caseData.npa_status,
            priority: caseData.priority,
            performance: caseData.performance,
            collection_amount: caseData.collection_amount || 0,
            toss_amount: caseData.toss_amount || 0,
            emi_amount: caseData.emi_amount || 0,
            interest: caseData.interest || 0,
            emp_id: caseData.emp_id,
            executiveId: realExecutiveId,
            month: caseData.month || new Date().getMonth() + 1,
            year: caseData.year || new Date().getFullYear(),
            upload_mode: caseData.upload_mode || 'ORIGINAL',
          },
        });
      });
      await Promise.all(upsertPromises);
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: Upserted ${batch.length} cases`);
    }

    // 4. Fetch created cases for response (fetch a sample, not all 20k)
    const sampleCases = await prisma.case.findMany({
      where: { upload_mode: uploadMode },
      take: 100, // Just get first 100 for response
      orderBy: { createdAt: 'desc' },
    });

    return {
      upload,
      cases: sampleCases,
    };
  } catch (error) {
    throw new Error(`Failed to bulk create cases: ${error.message}`);
  }
};

/**
 * Allocate cases to executives based on emp_id
 * One emp_id can have multiple executives assigned (one-to-many)
 */
const allocateCasesToExecutive = async (emp_id, executiveId) => {
  try {
    const updated = await prisma.case.updateMany({
      where: { emp_id, executiveId: null }, // Only unallocated cases
      data: { executiveId },
    });
    return updated;
  } catch (error) {
    throw new Error(`Failed to allocate cases: ${error.message}`);
  }
};

/**
 * Allocate cases in batch for multiple executives
 */
const bulkAllocateCases = async (allocations) => {
  try {
    const results = [];
    for (const { emp_id, executiveId } of allocations) {
      const result = await allocateCasesToExecutive(emp_id, executiveId);
      results.push({ emp_id, executiveId, updated: result.count });
    }
    return results;
  } catch (error) {
    throw new Error(`Failed to bulk allocate cases: ${error.message}`);
  }
};

/**
 * Get cases for an executive
 */
const getCasesForExecutive = async (executiveId, filters = {}) => {
  try {
    const where = { executiveId };

    // Apply filters
    if (filters.bkt) where.bkt = filters.bkt;
    if (filters.product_type) where.product_type = filters.product_type;
    if (filters.npa_status) where.npa_status = filters.npa_status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.status) where.status = filters.status;

    const cases = await prisma.case.findMany({
      where,
      include: {
        feedbacks: true,
        executive: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return cases;
  } catch (error) {
    throw new Error(`Failed to fetch cases: ${error.message}`);
  }
};

/**
 * Get single case with all feedbacks
 */
const getCaseById = async (caseId) => {
  try {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        feedbacks: {
          orderBy: { createdAt: 'desc' },
          include: {
            executive: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        executive: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    return caseRecord;
  } catch (error) {
    throw new Error(`Failed to fetch case: ${error.message}`);
  }
};

/**
 * Get single case by acc_id (account identifier)
 */
const getCaseByAccId = async (accId) => {
  try {
    const caseRecord = await prisma.case.findUnique({
      where: { acc_id: accId },
      include: {
        feedbacks: {
          orderBy: { createdAt: 'desc' },
        },
        executive: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    return caseRecord;
  } catch (error) {
    throw new Error(`Failed to fetch case by acc_id: ${error.message}`);
  }
};

/**
 * Update case status
 */
const updateCaseStatus = async (caseId, status) => {
  try {
    const updated = await prisma.case.update({
      where: { id: caseId },
      data: { status },
    });
    return updated;
  } catch (error) {
    throw new Error(`Failed to update case status: ${error.message}`);
  }
};

/**
 * Get performance summary for an executive (Count-wise & POS-wise)
 */
const getExecutivePerformance = async (executiveId, filters = {}) => {
  try {
    const { month, year, bank, product, bkt } = filters;

    const where = { executiveId };
    if (month) where.month = month;
    if (year) where.year = year;
    if (bank) where.bank_name = bank;
    if (product) where.product_type = product;
    if (bkt) where.bkt = bkt;

    const cases = await prisma.case.findMany({
      where,
      include: {
        feedbacks: true,
      },
    });

    // Calculate metrics
    const totalCases = cases.length;
    const visitedCases = cases.filter((c) => c.feedbacks.length > 0).length;
    const totalPOS = cases.reduce((sum, c) => sum + (c.pos_amount || 0), 0);
    const recoveredPOS = cases
      .filter((c) => c.status === 'PAID' || c.status === 'CLOSED')
      .reduce((sum, c) => sum + (c.pos_amount || 0), 0);

    // Group by BKT and Product
    const byBKT = {};
    const byProduct = {};

    cases.forEach((c) => {
      if (!byBKT[c.bkt]) {
        byBKT[c.bkt] = { count: 0, pos: 0, visited: 0 };
      }
      byBKT[c.bkt].count += 1;
      byBKT[c.bkt].pos += c.pos_amount || 0;
      if (c.feedbacks.length > 0) byBKT[c.bkt].visited += 1;

      if (!byProduct[c.product_type]) {
        byProduct[c.product_type] = { count: 0, pos: 0, visited: 0 };
      }
      byProduct[c.product_type].count += 1;
      byProduct[c.product_type].pos += c.pos_amount || 0;
      if (c.feedbacks.length > 0) byProduct[c.product_type].visited += 1;
    });

    // Additional POS-based performance metrics per specification:
    // - posNotFlow: sum POS where performance != 'FLOW'
    // - posRB: sum POS where performance == 'RB'
    // - posNorm: sum POS where performance == 'NORM'
    const normalizePerf = (p) => (p ? String(p).trim().toUpperCase() : '');

    let posNotFlow = 0;
    let posRB = 0;
    let posNorm = 0;

    // status counts
    let flowCount = 0;
    let rbCount = 0;
    let normCount = 0;
    let stabCount = 0;

    // unique banks/products
    const bankSet = new Set();
    const productSet = new Set();

    // visits (including multiple per account)
    let totalVisits = 0;

    // recovered amounts
    let totalRecoveredAmount = 0; // sum of collection_amount
    let paidRecoveredAmount = 0; // sum collection_amount where perf != FLOW

    // Nested breakdown: bank -> product -> bkt
    const byBank = {};

    cases.forEach((c) => {
      const perf = normalizePerf(c.performance);
      const pos = c.pos_amount || 0;

      if (perf !== 'FLOW') posNotFlow += pos;
      if (perf === 'RB') posRB += pos;
      if (perf === 'NORM') posNorm += pos;

      const bank = c.bank_name || 'UNKNOWN';
      const product = c.product_type || 'UNKNOWN';
      const bkt = c.bkt || 'UNKNOWN';

      // collect unique sets
      if (bank) bankSet.add(bank);
      if (product) productSet.add(product);

      // visits
      totalVisits += (c.feedbacks && c.feedbacks.length) ? c.feedbacks.length : 0;

      // recovered amounts (case-level)
      const collected = c.collection_amount || 0;
      totalRecoveredAmount += collected;
      if (perf !== 'FLOW') paidRecoveredAmount += collected;

      // status counts
      if (perf === 'FLOW') flowCount += 1;
      else if (perf === 'RB') rbCount += 1;
      else if (perf === 'NORM') normCount += 1;
      else if (perf === 'STAB' || perf === 'STAB. ' || perf === 'STAB') stabCount += 1;

      if (!byBank[bank]) {
        byBank[bank] = {
          totalCases: 0,
          totalPOS: 0,
          posNotFlow: 0,
          posRB: 0,
          posNorm: 0,
          flowCount: 0,
          rbCount: 0,
          normCount: 0,
          stabCount: 0,
          resolvedCount: 0,
          recoveredAmount: 0,
          paidRecoveredAmount: 0,
          products: {},
        };
      }

      byBank[bank].totalCases += 1;
      byBank[bank].totalPOS += pos;
      if (perf !== 'FLOW') byBank[bank].posNotFlow += pos;
      if (perf === 'RB') byBank[bank].posRB += pos;
      if (perf === 'NORM') byBank[bank].posNorm += pos;

      // counts by perf on bank
      if (perf === 'FLOW') byBank[bank].flowCount += 1;
      if (perf === 'RB') byBank[bank].rbCount += 1;
      if (perf === 'NORM') byBank[bank].normCount += 1;
      if (perf === 'STAB') byBank[bank].stabCount += 1;

      // resolved cases per bank (status PAID or CLOSED)
      if (c.status === 'PAID' || c.status === 'CLOSED') byBank[bank].resolvedCount += 1;

      // bank-level recovered amount (sum collection_amount)
      byBank[bank].recoveredAmount += collected;
      if (perf !== 'FLOW') byBank[bank].paidRecoveredAmount += collected;

      if (!byBank[bank].products[product]) {
        byBank[bank].products[product] = {
          totalCases: 0,
          totalPOS: 0,
          posNotFlow: 0,
          posRB: 0,
          posNorm: 0,
          flowCount: 0,
          rbCount: 0,
          normCount: 0,
          stabCount: 0,
          resolvedCount: 0,
          recoveredAmount: 0,
          paidRecoveredAmount: 0,
          bkts: {},
        };
      }

      const prodObj = byBank[bank].products[product];
      prodObj.totalCases += 1;
      prodObj.totalPOS += pos;
      if (perf !== 'FLOW') prodObj.posNotFlow += pos;
      if (perf === 'RB') prodObj.posRB += pos;
      if (perf === 'NORM') prodObj.posNorm += pos;

      if (perf === 'FLOW') prodObj.flowCount += 1;
      if (perf === 'RB') prodObj.rbCount += 1;
      if (perf === 'NORM') prodObj.normCount += 1;
      if (perf === 'STAB') prodObj.stabCount += 1;

      if (c.status === 'PAID' || c.status === 'CLOSED') prodObj.resolvedCount += 1;
      prodObj.recoveredAmount += collected;
      if (perf !== 'FLOW') prodObj.paidRecoveredAmount += collected;

      if (!prodObj.bkts[bkt]) {
        prodObj.bkts[bkt] = {
          totalCases: 0,
          totalPOS: 0,
          posNotFlow: 0,
          posRB: 0,
          posNorm: 0,
          flowCount: 0,
          rbCount: 0,
          normCount: 0,
          stabCount: 0,
          resolvedCount: 0,
          recoveredAmount: 0,
          paidRecoveredAmount: 0,
        };
      }

      const bktObj = prodObj.bkts[bkt];
      bktObj.totalCases += 1;
      bktObj.totalPOS += pos;
      if (perf !== 'FLOW') bktObj.posNotFlow += pos;
      if (perf === 'RB') bktObj.posRB += pos;
      if (perf === 'NORM') bktObj.posNorm += pos;

      if (perf === 'FLOW') bktObj.flowCount += 1;
      if (perf === 'RB') bktObj.rbCount += 1;
      if (perf === 'NORM') bktObj.normCount += 1;
      if (perf === 'STAB') bktObj.stabCount += 1;

      if (c.status === 'PAID' || c.status === 'CLOSED') bktObj.resolvedCount += 1;
      bktObj.recoveredAmount += collected;
      if (perf !== 'FLOW') bktObj.paidRecoveredAmount += collected;
    });

    // Convert byBank.products and bkts into arrays for easier frontend consumption (optional)
    const bankBreakdown = Object.entries(byBank).map(([bankName, bankObj]) => {
      const totalCasesBank = bankObj.totalCases || 0;
      const totalPOSBank = bankObj.totalPOS || 0;
      const countNotFlow = (bankObj.rbCount || 0) + (bankObj.normCount || 0) + (bankObj.stabCount || 0);
      const countNotFlowRate = totalCasesBank > 0 ? (countNotFlow / totalCasesBank) * 100 : 0;
      const posNotFlowRateBank = totalPOSBank > 0 ? (bankObj.posNotFlow / totalPOSBank) * 100 : 0;

      return {
        bankName,
        totalCases: totalCasesBank,
        totalPOS: totalPOSBank,
        resolvedCount: bankObj.resolvedCount || 0,
        flowCount: bankObj.flowCount || 0,
        rbCount: bankObj.rbCount || 0,
        normCount: bankObj.normCount || 0,
        stabCount: bankObj.stabCount || 0,
        countNotFlow,
        countNotFlowRate,
        posNotFlow: bankObj.posNotFlow || 0,
        posNotFlowRate: posNotFlowRateBank,
        posRB: bankObj.posRB || 0,
        posRBRate: totalPOSBank > 0 ? (bankObj.posRB / totalPOSBank) * 100 : 0,
        posNorm: bankObj.posNorm || 0,
        posNormRate: totalPOSBank > 0 ? (bankObj.posNorm / totalPOSBank) * 100 : 0,
        recoveredAmount: bankObj.recoveredAmount || 0,
        paidRecoveredAmount: bankObj.paidRecoveredAmount || 0,
        products: Object.entries(bankObj.products).map(([prodName, prodObj]) => {
          const tc = prodObj.totalCases || 0;
          const tp = prodObj.totalPOS || 0;
          const prodCountNotFlow = (prodObj.rbCount || 0) + (prodObj.normCount || 0) + (prodObj.stabCount || 0);
          return {
            productName: prodName,
            totalCases: tc,
            totalPOS: tp,
            resolvedCount: prodObj.resolvedCount || 0,
            flowCount: prodObj.flowCount || 0,
            rbCount: prodObj.rbCount || 0,
            normCount: prodObj.normCount || 0,
            stabCount: prodObj.stabCount || 0,
            countNotFlow: prodCountNotFlow,
            countNotFlowRate: tc > 0 ? (prodCountNotFlow / tc) * 100 : 0,
            posNotFlow: prodObj.posNotFlow || 0,
            posNotFlowRate: tp > 0 ? (prodObj.posNotFlow / tp) * 100 : 0,
            recoveredAmount: prodObj.recoveredAmount || 0,
            paidRecoveredAmount: prodObj.paidRecoveredAmount || 0,
            bkts: Object.entries(prodObj.bkts).map(([bktName, bObj]) => {
              const bc = bObj.totalCases || 0;
              const bp = bObj.totalPOS || 0;
              const bCountNotFlow = (bObj.rbCount || 0) + (bObj.normCount || 0) + (bObj.stabCount || 0);
              return {
                bkt: bktName,
                totalCases: bc,
                totalPOS: bp,
                flowCount: bObj.flowCount || 0,
                rbCount: bObj.rbCount || 0,
                normCount: bObj.normCount || 0,
                stabCount: bObj.stabCount || 0,
                countNotFlow: bCountNotFlow,
                countNotFlowRate: bc > 0 ? (bCountNotFlow / bc) * 100 : 0,
                posNotFlow: bObj.posNotFlow || 0,
                posNotFlowRate: bp > 0 ? (bObj.posNotFlow / bp) * 100 : 0,
                // RB / NORM specific metrics
                rbCountRate: bc > 0 ? ((bObj.rbCount || 0) / bc) * 100 : 0,
                normCountRate: bc > 0 ? ((bObj.normCount || 0) / bc) * 100 : 0,
                posRB: bObj.posRB || 0,
                posRBRate: bp > 0 ? (bObj.posRB / bp) * 100 : 0,
                posNorm: bObj.posNorm || 0,
                posNormRate: bp > 0 ? (bObj.posNorm / bp) * 100 : 0,
                recoveredAmount: bObj.recoveredAmount || 0,
                paidRecoveredAmount: bObj.paidRecoveredAmount || 0,
              };
            })
          };
        }),
      };
    });

    const totalBanks = bankSet.size;
    const totalProducts = productSet.size;
    const totalPaidCases = flowCount + rbCount + normCount; // as requested: flow + rb + norm

    return {
      // Top-level summary
      totalCases,
      totalPOS,
      totalBanks,
      totalProducts,
      totalVisitedCases: visitedCases,
      totalVisits,
      totalRecoveredAmount,
      paidRecoveredAmount,
      // Counts by performance status
      flowCount,
      rbCount,
      normCount,
      stabCount,
      totalPaidCases,
      visitRate: totalCases > 0 ? (visitedCases / totalCases) * 100 : 0,
      recoveredPOS,
      recoveryRate: totalPOS > 0 ? (recoveredPOS / totalPOS) * 100 : 0,
      // POS-based performance metrics (absolute values)
      posNotFlow,
      posRB,
      posNorm,
      // POS-based performance metrics (ratios)
      posNotFlowRate: totalPOS > 0 ? (posNotFlow / totalPOS) * 100 : 0,
      posRBRate: totalPOS > 0 ? (posRB / totalPOS) * 100 : 0,
      posNormRate: totalPOS > 0 ? (posNorm / totalPOS) * 100 : 0,
      // Pie chart counts
      pie: {
        flow: flowCount,
        rb: rbCount,
        norm: normCount,
        stab: stabCount,
      },
      // Nested breakdown per bank -> product -> bkt
      bankBreakdown,
      byBKT,
      byProduct,
    };
  } catch (error) {
    throw new Error(`Failed to fetch performance data: ${error.message}`);
  }
};

/**
 * Build leaderboard of executives. Returns array of executives with aggregated metrics and ranking keys.
 */
const getLeaderboard = async (user, month, year) => {
  try {
    // Fetch relevant cases for the period
    const cases = await prisma.case.findMany({
      where: { month, year, executiveId: { not: null } },
      select: {
        executiveId: true,
        pos_amount: true,
        performance: true,
        status: true,
        collection_amount: true,
      },
    });

    // Map executiveId -> aggregated metrics
    const map = {};
    cases.forEach((c) => {
      const exec = c.executiveId;
      if (!map[exec]) {
        map[exec] = {
          executiveId: exec,
          totalCases: 0,
          totalPOS: 0,
          countNotFlow: 0,
          posNotFlow: 0,
          rbCount: 0,
          normCount: 0,
          posRB: 0,
          posNorm: 0,
          recoveredAmount: 0,
          paidRecoveredAmount: 0,
        };
      }

      const perf = c.performance ? String(c.performance).trim().toUpperCase() : '';
      const pos = c.pos_amount || 0;
      const collected = c.collection_amount || 0;

      map[exec].totalCases += 1;
      map[exec].totalPOS += pos;

      if (perf !== 'FLOW') {
        map[exec].countNotFlow += 1;
        map[exec].posNotFlow += pos;
      }
      if (perf === 'RB') { map[exec].rbCount += 1; map[exec].posRB += pos; }
      if (perf === 'NORM') { map[exec].normCount += 1; map[exec].posNorm += pos; }

      map[exec].recoveredAmount += collected;
      if (perf !== 'FLOW') map[exec].paidRecoveredAmount += collected;
    });

    // Fetch user details for executives
    const execIds = Object.keys(map);
    const users = execIds.length > 0 ? await prisma.user.findMany({ where: { id: { in: execIds } }, select: { id: true, firstName: true, lastName: true, emp_id: true, roles: { select: { role: { select: { name: true } } } } } }) : [];

    const usersById = {};
    users.forEach(u => usersById[u.id] = u);

    // Build leaderboard array
    const rows = Object.values(map).map((m) => {
      const totalPOS = m.totalPOS || 0;
      const posNotFlowRate = totalPOS > 0 ? (m.posNotFlow / totalPOS) * 100 : 0;
      const posRBRate = totalPOS > 0 ? (m.posRB / totalPOS) * 100 : 0;
      const posNormRate = totalPOS > 0 ? (m.posNorm / totalPOS) * 100 : 0;
      const countNotFlowRate = m.totalCases > 0 ? (m.countNotFlow / m.totalCases) * 100 : 0;

      const userInfo = usersById[m.executiveId] || {};

      return {
        id: m.executiveId,
        name: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim(),
        emp_id: userInfo.emp_id || null,
        totalCases: m.totalCases,
        totalPOS: totalPOS,
        countNotFlow: m.countNotFlow,
        countNotFlowRate,
        posNotFlow: m.posNotFlow,
        posNotFlowRate,
        rbCount: m.rbCount,
        normCount: m.normCount,
        posRB: m.posRB,
        posRBRate,
        posNorm: m.posNorm,
        posNormRate,
        recoveredAmount: m.recoveredAmount,
        paidRecoveredAmount: m.paidRecoveredAmount,
      };
    });

    // Exclude users who are supervisors/manager/admin from leaderboard entries (only include executives)
    // Fetch roles for execIds (we already included roles in users findMany)
    const filtered = rows.filter(r => {
      const u = usersById[r.id];
      if (!u) return false;
      const roleNames = (u.roles || []).map(rr => rr.role.name.toLowerCase());
      return roleNames.includes('executive') || roleNames.includes('executive'.toLowerCase());
    });

    // Sort by primary metric: posNotFlowRate desc; tie-breaker: (posRBRate + posNormRate) desc; then totalPOS desc
    filtered.sort((a, b) => {
      if (b.posNotFlowRate !== a.posNotFlowRate) return b.posNotFlowRate - a.posNotFlowRate;
      const aTie = (a.posRBRate || 0) + (a.posNormRate || 0);
      const bTie = (b.posRBRate || 0) + (b.posNormRate || 0);
      if (bTie !== aTie) return bTie - aTie;
      return (b.totalPOS || 0) - (a.totalPOS || 0);
    });

    // Add rank
    filtered.forEach((row, idx) => row.rank = idx + 1);

    return filtered;
  } catch (error) {
    throw new Error(`Failed to build leaderboard: ${error.message}`);
  }
};

/**
 * Get all cases by filters (for Supervisor dashboard)
 */
const getAllCases = async (filters = {}) => {
  try {
    const where = {};

    if (filters.status) where.status = filters.status;
    if (filters.bkt) where.bkt = filters.bkt;
    if (filters.product_type) where.product_type = filters.product_type;
    if (filters.month) where.month = filters.month;
    if (filters.year) where.year = filters.year;
    if (filters.bank_name) where.bank_name = filters.bank_name;

    const cases = await prisma.case.findMany({
      where,
      include: {
        feedbacks: true,
        executive: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });

    const total = await prisma.case.count({ where });

    return {
      cases,
      total,
      limit: filters.limit || 100,
      offset: filters.offset || 0,
    };
  } catch (error) {
    throw new Error(`Failed to fetch cases: ${error.message}`);
  }
};

module.exports = {
  createCase,
  bulkCreateCases,
  allocateCasesToExecutive,
  bulkAllocateCases,
  getCasesForExecutive,
  getCaseById,
  updateCaseStatus,
  getExecutivePerformance,
  getLeaderboard,
  getAllCases,
  /**
   * Get visited cases (cases with feedbacks) with visit counts and feedbacks included
   * filters: { month, year, bank, product, bkt, limit, offset }
   */
  getVisitedCases: async (filters = {}) => {
    try {
      const where = {};
      const { month, year, bank, product, bkt, limit, offset } = filters;
      if (month) where.month = month;
      if (year) where.year = year;
      if (bank) where.bank_name = bank;
      if (product) where.product_type = product;
      if (bkt) where.bkt = bkt;

      // Only include cases that have at least one feedback
      where.AND = [{ feedbacks: { some: {} } }];

      const cases = await prisma.case.findMany({
        where,
        include: {
          feedbacks: {
            orderBy: { createdAt: 'desc' },
            include: { executive: { select: { id: true, firstName: true, lastName: true, emp_id: true } } },
          },
          executive: { select: { id: true, firstName: true, lastName: true, emp_id: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit || 100,
        skip: offset || 0,
      });

      const total = await prisma.case.count({ where });

      // Map to include visit count
      const mapped = cases.map(c => ({
        id: c.id,
        acc_id: c.acc_id,
        customer_name: c.customer_name,
        bank_name: c.bank_name,
        product_type: c.product_type,
        bkt: c.bkt,
        executive: c.executive,
        visits: (c.feedbacks || []).length,
        lastVisitAt: (c.feedbacks && c.feedbacks.length) ? c.feedbacks[0].createdAt : null,
        feedbacks: c.feedbacks,
      }));

      return { cases: mapped, total, limit: limit || 100, offset: offset || 0 };
    } catch (error) {
      throw new Error(`Failed to fetch visited cases: ${error.message}`);
    }
  },
};
