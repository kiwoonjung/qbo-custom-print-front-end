const Login = ({ handleConnect }) => {
  return (
    <div className="text-center">
      <p className="text-2xl pb-4">Welcome to PFP Custom Print!</p>
      <button onClick={handleConnect}>Connect to QuickBooks</button>
    </div>
  );
};

export default Login;
