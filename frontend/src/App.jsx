
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';

function App() {
  const [mode, setMode] = useState('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Restore the existing session and listen for login/logout.
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setMessage(error.message);
      setSession(data?.session ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });

        if (error) throw error;

        if (data.session) {
          setMessage('Account created successfully!');
        } else {
          setMessage(
            'Signup submitted. Check your email to confirm your account.'
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        setMessage('Login successful!');
      }
    } catch (error) {
      setMessage(error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signOut();

    setMessage(error ? error.message : 'You have logged out.');
    setLoading(false);
  }

  if (session) {
    return (
      <main style={styles.container}>
        <section style={styles.card}>
          <h1>MedicTrack</h1>
          <h2>You're signed in!</h2>
          <p>Email: {session.user.email}</p>
          <p>Your authentication session is active.</p>
          <button
            style={styles.button}
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? 'Please wait...' : 'Log out'}
          </button>
          {message && <p role="status">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <h1>MedicTrack</h1>
        <p>Medication management made simpler.</p>

        <div style={styles.tabs}>
          <button
            type="button"
            style={mode === 'signup' ? styles.activeTab : styles.tab}
            onClick={() => {
              setMode('signup');
              setMessage('');
            }}
          >
            Sign up
          </button>
          <button
            type="button"
            style={mode === 'login' ? styles.activeTab : styles.tab}
            onClick={() => {
              setMode('login');
              setMessage('');
            }}
          >
            Log in
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label style={styles.label}>
              Full name
              <input
                style={styles.input}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label style={styles.label}>
            Email
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === 'signup' ? 'new-password' : 'current-password'
              }
              minLength={6}
              required
            />
          </label>

          <button
            style={styles.button}
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : mode === 'signup'
                ? 'Create account'
                : 'Log in'}
          </button>
        </form>

        {message && <p role="status">{message}</p>}
      </section>
    </main>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    background: '#f3f6fb',
    padding: '24px',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    boxSizing: 'border-box',
    padding: '32px',
    borderRadius: '16px',
    background: '#ffffff',
    color: '#172033',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    margin: '24px 0',
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#172033',
    cursor: 'pointer',
  },
  activeTab: {
    flex: 1,
    padding: '10px',
    border: '1px solid #2563eb',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#ffffff',
    cursor: 'pointer',
  },
  label: {
    display: 'block',
    marginBottom: '16px',
    fontWeight: 600,
  },
  input: {
    display: 'block',
    boxSizing: 'border-box',
    width: '100%',
    padding: '12px',
    marginTop: '8px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
  },
  button: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#ffffff',
    fontSize: '16px',
    cursor: 'pointer',
  },
};

export default App;
