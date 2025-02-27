const Login = ({ handleConnect }) => {
  return (
    <div>
      <h1>QuickBooks Chrome Extension</h1>
      <button onClick={handleConnect}>Connect to QuickBooks</button>
    </div>
  );
};

export default Login;
