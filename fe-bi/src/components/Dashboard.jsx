import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5001/api';

const teamMembers = [
  { name: 'Mhd Ulil Abshar', nim: '2211521003' },
  { name: 'Nouval Habibie', nim: '2211521020' },
  { name: 'Mustafa Fathur Rahman', nim: '2211522036' },
];

const StatCard = ({ title, value, icon, color }) => (
  <div className={`bg-white rounded-lg shadow-md p-3 flex flex-col items-center justify-center ${color}`} style={{ minWidth: 0 }}>
    <div className="p-1 rounded flex items-center justify-center text-lg mb-1">{icon}</div>
    <div className="text-center">
      <p className="text-gray-500 font-medium text-xs">{title}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [complaintsTrend, setComplaintsTrend] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [issuesDistribution, setIssuesDistribution] = useState([]);
  const [stateDistribution, setStateDistribution] = useState([]);
  const [issueProductHeatmap, setIssueProductHeatmap] = useState([]);
  const [disputeByResponse, setDisputeByResponse] = useState([]);
  const [timelyByChannel, setTimelyByChannel] = useState([]);
  const [avgResponseByProduct, setAvgResponseByProduct] = useState([]);
  const [responseStats, setResponseStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const fetchData = async (state = '', date = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (state) params.state = state;
      if (date) params.date = date;
      const [
        overviewRes,
        trendRes,
        companiesRes,
        issuesRes,
        statesRes,
        heatmapRes,
        disputeRes,
        timelyRes,
        avgRes,
        statsRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/overview`, { params }),
        axios.get(`${API_BASE_URL}/complaints-trend`, { params }),
        axios.get(`${API_BASE_URL}/top-companies`, { params }),
        axios.get(`${API_BASE_URL}/issues-distribution`, { params }),
        axios.get(`${API_BASE_URL}/state-distribution`, { params }),
        axios.get(`${API_BASE_URL}/issue-product-heatmap`, { params }),
        axios.get(`${API_BASE_URL}/dispute-by-response`, { params }),
        axios.get(`${API_BASE_URL}/timely-by-channel`, { params }),
        axios.get(`${API_BASE_URL}/avg-response-by-product`, { params }),
        axios.get(`${API_BASE_URL}/response-stats`, { params })
      ]);
      setOverview(overviewRes.data);
      setComplaintsTrend(trendRes.data);
      setTopCompanies(companiesRes.data);
      setIssuesDistribution(issuesRes.data);
      setStateDistribution(statesRes.data);
      setIssueProductHeatmap(heatmapRes.data);
      setDisputeByResponse(disputeRes.data);
      setTimelyByChannel(timelyRes.data);
      setAvgResponseByProduct(avgRes.data);
      setResponseStats(statsRes.data);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedState, selectedDate);
    // eslint-disable-next-line
  }, [selectedState, selectedDate]);

  const uniqueStates = [...new Set(stateDistribution.map(d => d.state))];
  const products = [...new Set(issueProductHeatmap.map(d => d.product))];
  const issues = [...new Set(issueProductHeatmap.map(d => d.issue))];
  const z = products.map(p => issues.map(i => {
    const found = issueProductHeatmap.find(d => d.product === p && d.issue === i);
    return found ? found.count : 0;
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
          <button onClick={() => fetchData(selectedState, selectedDate)} className="absolute top-0 right-0 px-4 py-3 text-red-700 hover:text-red-900">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow z-10">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-6 py-3">
          <h1 className="text-xl font-bold text-blue-800">Customer Complaints Dashboard</h1>
          <div className="flex items-center gap-3">
            <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="h-9 px-3 rounded border text-sm">
              <option value="">All States</option>
              {uniqueStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="h-9 px-3 rounded border text-sm" />
          </div>
        </div>
      </header>
      <main className="max-w-screen-2xl mx-auto px-6 py-6 w-full">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard title="Total Complaints" value={overview.total_complaints?.toLocaleString() || '-'} icon={<svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} color="bg-blue-50" />
          <StatCard title="Avg. Resolution Time" value={overview.avg_resolution_time ? `${overview.avg_resolution_time} days` : '-'} icon={<svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="bg-green-50" />
          <StatCard title="Timely Response Rate" value={overview.timely_response_rate ? `${overview.timely_response_rate}%` : '-'} icon={<svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="bg-yellow-50" />
          <StatCard title="Dispute Rate" value={overview.dispute_rate ? `${overview.dispute_rate}%` : '-'} icon={<svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} color="bg-red-50" />
        </div>
        {/* Chart Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Complaints Trend */}
          <div className="bg-white rounded-xl shadow-md p-5 flex flex-col">
            <span className="text-base font-semibold mb-2">Complaints Trend</span>
            <div className="flex-1 min-h-[220px]">
              {complaintsTrend.length === 0 ? (
                <div className="text-center text-gray-400 py-10">No data for this filter</div>
              ) : (
                <Plot
                  data={[{
                    x: complaintsTrend.map(d => `${d.year}-${d.month}`),
                    y: complaintsTrend.map(d => d.complaint_count),
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Complaints',
                    line: { width: 2, color: '#3b82f6' }
                  }]}
                  layout={{
                    margin: { t: 20, r: 10, l: 40, b: 40 },
                    font: { size: 12 },
                    title: '',
                    xaxis: { title: 'Date', gridcolor: '#e5e7eb', tickangle: -45 },
                    yaxis: { title: 'Number of Complaints', gridcolor: '#e5e7eb' },
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '220px' }}
                />
              )}
            </div>
            <span className="text-xs text-gray-400 mt-1">Grafik ini menunjukkan tren jumlah keluhan yang diterima setiap bulan.</span>
          </div>
          {/* Top Companies */}
          <div className="bg-white rounded-xl shadow-md p-5 flex flex-col">
            <span className="text-base font-semibold mb-2">Top 10 Companies by Complaints</span>
            <div className="flex-1 min-h-[220px]">
              {topCompanies.length === 0 ? (
                <div className="text-center text-gray-400 py-10">No data for this filter</div>
              ) : (
                <Plot
                  data={[{
                    y: topCompanies.map(d => d.company),
                    x: topCompanies.map(d => d.complaint_count),
                    type: 'bar',
                    orientation: 'h',
                    marker: { color: '#3b82f6' }
                  }]}
                  layout={{
                    margin: { t: 20, r: 10, l: 120, b: 40 },
                    font: { size: 12 },
                    title: '',
                    xaxis: { title: 'Number of Complaints', gridcolor: '#e5e7eb' },
                    yaxis: { automargin: true },
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '220px' }}
                />
              )}
            </div>
            <span className="text-xs text-gray-400 mt-1">Bar chart ini menampilkan perusahaan dengan jumlah keluhan terbanyak.</span>
          </div>
          {/* Issues Distribution */}
          <div className="bg-white rounded-xl shadow-md p-5 flex flex-col overflow-x-auto">
            <span className="text-base font-semibold mb-2">Issues Distribution</span>
            <div className="flex-1 min-h-[220px]">
              {issuesDistribution.length === 0 ? (
                <div className="text-center text-gray-400 py-10">No data for this filter</div>
              ) : (
                <Plot
                  data={[{
                    labels: issuesDistribution.map(d => d.issue),
                    values: issuesDistribution.map(d => d.count),
                    type: 'pie',
                    hole: 0.4,
                    marker: {
                      colors: [
                        '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'
                      ]
                    }
                  }]}
                  layout={{
                    margin: { t: 20, r: 10, l: 10, b: 40 },
                    font: { size: 12 },
                    title: '',
                    showlegend: true
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '220px', minWidth: 300 }}
                />
              )}
            </div>
            <span className="text-xs text-gray-400 mt-1">Pie chart ini memperlihatkan distribusi isu utama yang dikeluhkan konsumen.</span>
          </div>
          {/* Complaints by State */}
          <div className="bg-white rounded-xl shadow-md p-5 flex flex-col">
            <span className="text-base font-semibold mb-2">Complaints by State</span>
            <div className="flex-1 min-h-[220px]">
              {stateDistribution.length === 0 ? (
                <div className="text-center text-gray-400 py-10">No data for this filter</div>
              ) : (
                <Plot
                  data={[{
                    type: 'choropleth',
                    locationmode: 'USA-states',
                    locations: stateDistribution.map(d => d.state),
                    z: stateDistribution.map(d => d.complaint_count),
                    text: stateDistribution.map(d => `${d.state}: ${d.complaint_count.toLocaleString()} complaints`),
                    colorscale: [
                      [0, '#dbeafe'], [0.5, '#60a5fa'], [1, '#1d4ed8']
                    ]
                  }]}
                  layout={{
                    margin: { t: 20, r: 0, l: 0, b: 0 },
                    font: { size: 12 },
                    title: '',
                    geo: {
                      scope: 'usa',
                      showlakes: true,
                      lakecolor: 'white'
                    }
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '220px' }}
                />
              )}
            </div>
            <span className="text-xs text-gray-400 mt-1">Peta ini menunjukkan distribusi keluhan berdasarkan negara bagian di Amerika Serikat.</span>
          </div>
          {/* Heatmap Issue-Product */}
          <div className="bg-white rounded-xl shadow-md p-5 flex flex-col overflow-x-auto">
            <span className="text-base font-semibold mb-2">Issue Distribution by Product</span>
            <div className="flex-1 min-h-[220px]">
              {products.length === 0 || issues.length === 0 ? (
                <div className="text-center text-gray-400 py-10">No data for this filter</div>
              ) : (
                <Plot
                  data={[{
                    x: issues,
                    y: products,
                    z: z,
                    type: 'heatmap',
                    colorscale: 'Blues',
                    hoverongaps: false
                  }]}
                  layout={{
                    margin: { t: 20, r: 10, l: 60, b: 40 },
                    font: { size: 12 },
                    title: '',
                    xaxis: { title: 'Issue', automargin: true },
                    yaxis: { title: 'Product', automargin: true },
                  }}
                  useResizeHandler
                  style={{ width: Math.max(300, issues.length * 18), height: Math.max(220, products.length * 18) }}
                />
              )}
            </div>
            <span className="text-xs text-gray-400 mt-1">Heatmap ini menunjukkan distribusi jumlah keluhan untuk setiap kombinasi produk dan isu utama.</span>
          </div>
          {/* Dispute by Response */}
          <div className="bg-white rounded-xl shadow-md p-5 flex flex-col">
            <span className="text-base font-semibold mb-2">Dispute Rate by Company Response Type</span>
            <div className="flex-1 min-h-[220px]">
              {disputeByResponse.length === 0 ? (
                <div className="text-center text-gray-400 py-10">No data for this filter</div>
              ) : (
                <Plot
                  data={[{
                    x: disputeByResponse.map(d => d.response_type),
                    y: disputeByResponse.map(d => d.disputed),
                    name: 'Disputed',
                    type: 'bar',
                    marker: { color: '#ef4444' }
                  }, {
                    x: disputeByResponse.map(d => d.response_type),
                    y: disputeByResponse.map(d => d.not_disputed),
                    name: 'Not Disputed',
                    type: 'bar',
                    marker: { color: '#10b981' }
                  }]}
                  layout={{
                    barmode: 'stack',
                    margin: { t: 20, r: 10, l: 40, b: 40 },
                    font: { size: 12 },
                    title: '',
                    xaxis: { title: 'Company Response', automargin: true },
                    yaxis: { title: 'Number of Complaints', automargin: true },
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '220px' }}
                />
              )}
            </div>
            <span className="text-xs text-gray-400 mt-1">Grafik ini memperlihatkan jumlah keluhan yang disengketakan dan tidak, berdasarkan tipe respons perusahaan.</span>
          </div>
          {/* Timely by Channel */}
          <div className="bg-white rounded-xl shadow-md p-5 flex flex-col">
            <span className="text-base font-semibold mb-2">Timely Response Rate by Channel</span>
            <div className="flex-1 min-h-[220px]">
              {timelyByChannel.length === 0 ? (
                <div className="text-center text-gray-400 py-10">No data for this filter</div>
              ) : (
                <Plot
                  data={[{
                    x: timelyByChannel.map(d => d.channel),
                    y: timelyByChannel.map(d => d.timely_rate),
                    type: 'bar',
                    marker: { color: '#3b82f6' }
                  }]}
                  layout={{
                    margin: { t: 20, r: 10, l: 40, b: 40 },
                    font: { size: 12 },
                    title: '',
                    xaxis: { title: 'Submission Channel', automargin: true },
                    yaxis: { title: 'Timely Response Rate (%)', automargin: true },
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '220px' }}
                />
              )}
            </div>
            <span className="text-xs text-gray-400 mt-1">Bar chart ini menunjukkan persentase respons tepat waktu berdasarkan saluran pengajuan keluhan.</span>
          </div>
          {/* Avg Response by Product */}
          <div className="bg-white rounded-xl shadow-md p-5 flex flex-col overflow-x-auto">
            <span className="text-base font-semibold mb-2">Average Response Time by Product</span>
            <div className="flex-1 min-h-[220px]">
              {avgResponseByProduct.length === 0 ? (
                <div className="text-center text-gray-400 py-10">No data for this filter</div>
              ) : (
                <Plot
                  data={[{
                    y: avgResponseByProduct.map(d => d.product),
                    x: avgResponseByProduct.map(d => d.avg_days),
                    type: 'bar',
                    orientation: 'h',
                    marker: { color: '#f59e42' }
                  }]}
                  layout={{
                    margin: { t: 20, r: 10, l: 80, b: 20 },
                    font: { size: 12 },
                    title: '',
                    xaxis: { title: 'Average Days to Response', automargin: true },
                    yaxis: { automargin: true },
                  }}
                  useResizeHandler
                  style={{ width: Math.max(300, avgResponseByProduct.length * 18), height: Math.max(220, avgResponseByProduct.length * 18) }}
                />
              )}
            </div>
            <span className="text-xs text-gray-400 mt-1">Grafik ini menampilkan rata-rata waktu respons perusahaan untuk setiap produk.</span>
          </div>
          {/* Pie Response Stats */}
          <div className="bg-white rounded-xl shadow-md p-5 flex flex-col">
            <span className="text-base font-semibold mb-2">Response & Dispute Distribution</span>
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 min-h-[220px]">
              {(!responseStats.timely_response || !responseStats.dispute) ? (
                <div className="text-center text-gray-400 py-10 w-full">No data for this filter</div>
              ) : (
                <>
                  <div className="flex-1">
                    <Plot
                      data={[{
                        labels: Object.keys(responseStats.timely_response || {}),
                        values: Object.values(responseStats.timely_response || {}),
                        type: 'pie',
                        hole: 0.4,
                        marker: { colors: ['#10b981', '#ef4444'] }
                      }]}
                      layout={{
                        margin: { t: 20, r: 10, l: 10, b: 10 },
                        font: { size: 12 },
                        title: 'Timely Response',
                        showlegend: true
                      }}
                      useResizeHandler
                      style={{ width: '100%', height: '180px', minWidth: 180 }}
                    />
                  </div>
                  <div className="flex-1">
                    <Plot
                      data={[{
                        labels: Object.keys(responseStats.dispute || {}),
                        values: Object.values(responseStats.dispute || {}),
                        type: 'pie',
                        hole: 0.4,
                        marker: { colors: ['#3b82f6', '#f59e42'] }
                      }]}
                      layout={{
                        margin: { t: 20, r: 10, l: 10, b: 10 },
                        font: { size: 12 },
                        title: 'Dispute',
                        showlegend: true
                      }}
                      useResizeHandler
                      style={{ width: '100%', height: '180px', minWidth: 180 }}
                    />
                  </div>
                </>
              )}
            </div>
            <span className="text-xs text-gray-400 mt-1">Pie chart ini memperlihatkan distribusi respons tepat waktu dan sengketa konsumen.</span>
          </div>
        </div>
      </main>
      <footer className="bg-white border-t py-3 mt-6">
        <div className="max-w-screen-xl mx-auto text-center text-xs text-gray-500">
          {teamMembers.map((member, idx) => (
            <span key={idx}>
              {member.name} ({member.nim}){idx < teamMembers.length - 1 && ' · '}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default Dashboard; 