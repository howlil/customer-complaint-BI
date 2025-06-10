import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5001/api';

const DRAWER_WIDTH = '240px';

const menuItems = [
  { 
    text: 'Overview', 
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ), 
    value: 'overview' 
  },
  { 
    text: 'Trends', 
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ), 
    value: 'trends' 
  },
  { 
    text: 'Companies', 
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ), 
    value: 'companies' 
  },
  { 
    text: 'Issues', 
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ), 
    value: 'issues' 
  },
  { 
    text: 'Locations', 
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ), 
    value: 'locations' 
  },
  { 
    text: 'About', 
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ), 
    value: 'about' 
  }
];

const teamMembers = [
  {
    name: "Nouval Habibie",
    nim: "2211521020",
    image: "https://via.placeholder.com/150"
  },
  {
    name: "Mhd Ulil Abshar",
    nim: "12345678",
    image: "https://via.placeholder.com/150"
  },
  {
    name: "Mustafa Fathur Rahman",
    nim: "12345678",
    image: "https://via.placeholder.com/150"
  },
  // Tambahkan anggota tim lainnya
];

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
    <div className="flex items-center">
      <div className={`p-3 rounded-lg flex items-center justify-center mr-4 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-600 font-medium">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [complaintsTrend, setComplaintsTrend] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [issuesDistribution, setIssuesDistribution] = useState([]);
  const [stateDistribution, setStateDistribution] = useState([]);
  const [responseChannels, setResponseChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        overviewRes,
        trendRes,
        companiesRes,
        issuesRes,
        statesRes,
        channelsRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/overview`),
        axios.get(`${API_BASE_URL}/complaints-trend`),
        axios.get(`${API_BASE_URL}/top-companies`),
        axios.get(`${API_BASE_URL}/issues-distribution`),
        axios.get(`${API_BASE_URL}/state-distribution`),
        axios.get(`${API_BASE_URL}/response-channels`)
      ]);

      setOverview(overviewRes.data);
      setComplaintsTrend(trendRes.data);
      setTopCompanies(companiesRes.data);
      setIssuesDistribution(issuesRes.data);
      setStateDistribution(statesRes.data);
      setResponseChannels(channelsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || error.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
          <button
            onClick={fetchData}
            className="absolute top-0 right-0 px-4 py-3 text-red-700 hover:text-red-900"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Complaints"
                value={overview.total_complaints.toLocaleString()}
                icon={
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
                color="bg-blue-100"
              />
              <StatCard
                title="Avg. Resolution Time"
                value={`${overview.avg_resolution_time} days`}
                icon={
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                color="bg-green-100"
              />
              <StatCard
                title="Timely Response Rate"
                value={`${overview.timely_response_rate}%`}
                icon={
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                color="bg-yellow-100"
              />
              <StatCard
                title="Dispute Rate"
                value={`${overview.dispute_rate}%`}
                icon={
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
                color="bg-red-100"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <Plot
                  data={[
                    {
                      x: complaintsTrend.map(d => `${d.year}-${d.month}`),
                      y: complaintsTrend.map(d => d.complaint_count),
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Complaints',
                      line: { width: 3, color: '#3b82f6' }
                    }
                  ]}
                  layout={{
                    title: 'Complaints Trend',
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    xaxis: { title: 'Date', gridcolor: '#e5e7eb' },
                    yaxis: { title: 'Number of Complaints', gridcolor: '#e5e7eb' },
                    margin: { t: 30, r: 30, l: 60, b: 40 }
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '400px' }}
                />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <Plot
                  data={[
                    {
                      y: topCompanies.map(d => d.company),
                      x: topCompanies.map(d => d.complaint_count),
                      type: 'bar',
                      orientation: 'h',
                      marker: { color: '#3b82f6' }
                    }
                  ]}
                  layout={{
                    title: 'Top 10 Companies by Complaints',
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    xaxis: { title: 'Number of Complaints', gridcolor: '#e5e7eb' },
                    yaxis: { automargin: true },
                    margin: { t: 30, r: 30, l: 200, b: 40 }
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '400px' }}
                />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <Plot
                  data={[
                    {
                      labels: issuesDistribution.map(d => d.issue),
                      values: issuesDistribution.map(d => d.count),
                      type: 'pie',
                      hole: 0.4,
                      marker: {
                        colors: [
                          '#3b82f6',
                          '#60a5fa',
                          '#93c5fd',
                          '#bfdbfe',
                          '#dbeafe'
                        ]
                      }
                    }
                  ]}
                  layout={{
                    title: 'Issues Distribution',
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    margin: { t: 30, r: 30, l: 30, b: 30 },
                    showlegend: true
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '400px' }}
                />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <Plot
                  data={[
                    {
                      type: 'choropleth',
                      locationmode: 'USA-states',
                      locations: stateDistribution.map(d => d.state),
                      z: stateDistribution.map(d => d.complaint_count),
                      text: stateDistribution.map(d => `${d.state}: ${d.complaint_count.toLocaleString()} complaints`),
                      colorscale: [
                        [0, '#dbeafe'],
                        [0.5, '#60a5fa'],
                        [1, '#1d4ed8']
                      ]
                    }
                  ]}
                  layout={{
                    title: 'Complaints by State',
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    geo: {
                      scope: 'usa',
                      showlakes: true,
                      lakecolor: 'white'
                    },
                    margin: { t: 30, r: 0, l: 0, b: 0 }
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '400px' }}
                />
              </div>
            </div>
          </div>
        );
      
      case 'about':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800">{member.name}</h3>
                  <p className="text-gray-600">NIM: {member.nim}</p>
                  <p className="text-gray-600 mt-2">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-[240px] bg-white shadow-lg z-30">
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-center h-16 border-b">
            <h1 className="text-xl font-bold text-gray-800">Customer Complaints</h1>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="p-2 space-y-1">
              {menuItems.map((item) => (
                <li key={item.value}>
                  <button
                    onClick={() => setActiveTab(item.value)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.value
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`${activeTab === item.value ? 'text-blue-600' : 'text-gray-500'}`}>
                      {item.icon}
                    </span>
                    <span className={`ml-3 font-medium ${
                      activeTab === item.value ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {item.text}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Filters */}
          <div className="p-4 border-t space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All States</option>
                {stateDistribution.map((state) => (
                  <option key={state.state} value={state.state}>
                    {state.state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate || ''}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-[240px]">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 h-16">
            <h2 className="text-2xl font-bold text-gray-800">
              {menuItems.find(item => item.value === activeTab)?.text || 'Dashboard'}
            </h2>
            <button
              onClick={fetchData}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
              title="Refresh data"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 