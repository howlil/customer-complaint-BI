import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Container, CircularProgress, Alert } from '@mui/material';
import Plot from 'react-plotly.js';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5001/api';

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [complaintsTrend, setComplaintsTrend] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [issuesDistribution, setIssuesDistribution] = useState([]);
  const [stateDistribution, setStateDistribution] = useState([]);
  const [responseChannels, setResponseChannels] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Test connection first
        const testConnection = await axios.get(`${API_BASE_URL}/test-connection`);
        console.log('Connection test result:', testConnection.data);

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

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  const handleStateClick = (state) => {
    setSelectedState(state === selectedState ? null : state);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ flexGrow: 1, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Customer Complaints Dashboard
        </Typography>
        
        {/* Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {overview && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">Total Complaints</Typography>
                  <Typography variant="h4">{overview.total_complaints}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">Avg. Resolution Time</Typography>
                  <Typography variant="h4">{overview.avg_resolution_time} days</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">Timely Response Rate</Typography>
                  <Typography variant="h4">{overview.timely_response_rate}%</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">Dispute Rate</Typography>
                  <Typography variant="h4">{overview.dispute_rate}%</Typography>
                </Paper>
              </Grid>
            </>
          )}
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Complaints Trend */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Plot
                data={[
                  {
                    x: complaintsTrend.map(d => `${d.year}-${d.month}`),
                    y: complaintsTrend.map(d => d.complaint_count),
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Complaints'
                  },
                  {
                    x: complaintsTrend.map(d => `${d.year}-${d.month}`),
                    y: complaintsTrend.map(d => d.avg_resolution_time),
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Avg Resolution Time',
                    yaxis: 'y2'
                  }
                ]}
                layout={{
                  title: 'Complaints Trend & Resolution Time',
                  xaxis: { title: 'Date' },
                  yaxis: { title: 'Number of Complaints' },
                  yaxis2: {
                    title: 'Avg Resolution Time (days)',
                    overlaying: 'y',
                    side: 'right'
                  },
                  showlegend: true
                }}
                useResizeHandler
                style={{ width: '100%', height: 400 }}
              />
            </Paper>
          </Grid>

          {/* Top Companies */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Plot
                data={[
                  {
                    y: topCompanies.map(d => d.company),
                    x: topCompanies.map(d => d.complaint_count),
                    type: 'bar',
                    orientation: 'h'
                  }
                ]}
                layout={{
                  title: 'Top 10 Companies by Complaints',
                  xaxis: { title: 'Number of Complaints' },
                  yaxis: { automargin: true }
                }}
                useResizeHandler
                style={{ width: '100%', height: 400 }}
              />
            </Paper>
          </Grid>

          {/* Issues Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Plot
                data={[
                  {
                    labels: issuesDistribution.map(d => d.issue),
                    values: issuesDistribution.map(d => d.count),
                    type: 'pie'
                  }
                ]}
                layout={{
                  title: 'Issues Distribution'
                }}
                useResizeHandler
                style={{ width: '100%', height: 400 }}
              />
            </Paper>
          </Grid>

          {/* State Distribution Map */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Plot
                data={[
                  {
                    type: 'choropleth',
                    locationmode: 'USA-states',
                    locations: stateDistribution.map(d => d.state),
                    z: stateDistribution.map(d => d.complaint_count),
                    text: stateDistribution.map(d => `${d.state}: ${d.complaint_count} complaints`),
                    colorscale: 'Viridis',
                    colorbar: { title: 'Number of Complaints' }
                  }
                ]}
                layout={{
                  title: 'Complaints by State',
                  geo: {
                    scope: 'usa',
                    showlakes: true,
                    lakecolor: 'rgb(255,255,255)'
                  }
                }}
                useResizeHandler
                style={{ width: '100%', height: 500 }}
                onClick={(data) => {
                  if (data.points && data.points[0]) {
                    handleStateClick(data.points[0].location);
                  }
                }}
              />
            </Paper>
          </Grid>

          {/* Response Channels */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Plot
                data={[
                  {
                    labels: responseChannels.map(d => d.submitted_via),
                    values: responseChannels.map(d => d.count),
                    type: 'pie',
                    hole: 0.4
                  }
                ]}
                layout={{
                  title: 'Response Channels Distribution'
                }}
                useResizeHandler
                style={{ width: '100%', height: 400 }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard; 