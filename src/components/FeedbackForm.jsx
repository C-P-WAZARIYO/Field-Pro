import React, { useState, useRef } from 'react';
import axios from '../api/axios';

export default function FeedbackForm({ caseData, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    caseId: caseData?.id,
    visit_code: '',
    meeting_place: '',
    asset_status: '',
    remarks: '',
    ptp_date: '',
  });
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const fileInputRef = useRef(null);

  // Get user's current location
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGeoError(null);
        },
        (error) => {
          setGeoError('Unable to get your location. Please enable location access.');
        }
      );
    } else {
      setGeoError('Geolocation is not supported by your browser.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!location) {
      setError('Please enable location access to submit feedback');
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        lat: location.lat,
        lng: location.lng,
      };

      const response = await axios.post('/feedbacks', submitData);

      if (response.data.success) {
        onSubmit(response.data.data);
        setFormData({
          caseId: caseData?.id,
          visit_code: '',
          meeting_place: '',
          asset_status: '',
          remarks: '',
          ptp_date: '',
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Submit Feedback</h2>
          {caseData && (
            <p className="text-gray-600">
              Account: {caseData.acc_id} | {caseData.customer_name} | ₹{caseData.pos_amount}
            </p>
          )}
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>}
      {geoError && <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">{geoError}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GPS Location</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={getLocation}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              📍 Get Current Location
            </button>
            {location && (
              <div className="text-sm text-green-600">
                ✓ Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </div>
            )}
          </div>
        </div>

        {/* Visit Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visit Code *</label>
          <input
            type="text"
            name="visit_code"
            value={formData.visit_code}
            onChange={handleInputChange}
            required
            placeholder="e.g., V001"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Meeting Place */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Place/Location *</label>
          <input
            type="text"
            name="meeting_place"
            value={formData.meeting_place}
            onChange={handleInputChange}
            required
            placeholder="Where did you meet the customer?"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Asset Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Asset Status *</label>
          <select
            name="asset_status"
            value={formData.asset_status}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Status</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="POOR">Poor</option>
            <option value="NOT_FOUND">Not Found</option>
          </select>
        </div>

        {/* PTP Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Next Action Date (PTP) *</label>
          <input
            type="date"
            name="ptp_date"
            value={formData.ptp_date}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleInputChange}
            rows="4"
            placeholder="Any additional notes..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photo Upload</label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Upload proof photo from the visit location</p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !location}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
