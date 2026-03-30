import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

const Login = () => {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // User is signed in
      const user = result.user;
      console.log('User Info:', user);
    } catch (error) {
      console.error('Error during sign-in:', error);
    }
  };

  return (
    <div>
      <button onClick={handleGoogleLogin}>Sign in with Google</button>
      {/* Add buttons for other providers similarly */}
    </div>
  );
};

export default Login; 