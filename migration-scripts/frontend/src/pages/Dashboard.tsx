import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ProfileData {
  identity: any;
  platforms: any;
  stats: any;
}

const Dashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/profile`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setProfile(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div style={styles.loading}>Loading your unified profile...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🚀 Unified Platform Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      {/* User Info Card */}
      <div style={styles.card}>
        <h2>👤 User Identity</h2>
        <p><strong>Name:</strong> {profile?.identity.full_name}</p>
        <p><strong>Email:</strong> {profile?.identity.email}</p>
        <p><strong>Phone:</strong> {profile?.identity.phone || 'Not set'}</p>
        <p><strong>Active Platforms:</strong> {profile?.stats.active_platforms.join(', ')}</p>
      </div>

      {/* Platforms Grid */}
      <div style={styles.grid}>
        {/* Freelancer Card */}
        <div style={{
          ...styles.platformCard,
          background: profile?.platforms.freelancer.active 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : '#f0f0f0'
        }}>
          <h3 style={{ color: profile?.platforms.freelancer.active ? 'white' : '#666' }}>
            💼 Freelancer Platform
          </h3>
          {profile?.platforms.freelancer.active ? (
            <div style={{ color: 'white' }}>
              <p>✅ Active</p>
              <p><strong>Title:</strong> {profile.platforms.freelancer.data?.freelancerProfile?.title || 'Not set'}</p>
              <p><strong>Experience:</strong> {profile.platforms.freelancer.data?.freelancerProfile?.experience_level}</p>
              <p><strong>Rate:</strong> ${profile.platforms.freelancer.data?.freelancerProfile?.preferred_rate}/hr</p>
            </div>
          ) : (
            <p>❌ Not active</p>
          )}
        </div>

        {/* Career Copilot Card */}
        <div style={{
          ...styles.platformCard,
          background: profile?.platforms.career_copilot.active
            ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            : '#f0f0f0'
        }}>
          <h3 style={{ color: profile?.platforms.career_copilot.active ? 'white' : '#666' }}>
            🎓 Career Copilot
          </h3>
          {profile?.platforms.career_copilot.active ? (
            <div style={{ color: 'white' }}>
              <p>✅ Active</p>
              <p><strong>Learning Plans:</strong> {profile.platforms.career_copilot.data?.learningPlans?.length || 0}</p>
            </div>
          ) : (
            <p>❌ Not active</p>
          )}
        </div>
      </div>

      {/* Raw Data (for demo purposes) */}
      <details style={styles.details}>
        <summary style={styles.summary}>🔍 View Raw Unified Profile Data</summary>
        <pre style={styles.pre}>{JSON.stringify(profile, null, 2)}</pre>
      </details>
    </div>
  );
};

const styles: any = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '28px',
    margin: 0,
  },
  logoutBtn: {
    padding: '10px 20px',
    background: '#ff4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  card: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  platformCard: {
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontSize: '24px',
  },
  details: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '18px',
    marginBottom: '16px',
  },
  pre: {
    background: '#f5f5f5',
    padding: '16px',
    borderRadius: '8px',
    overflow: 'auto',
    fontSize: '12px',
  },
};

export default Dashboard;