import { useAuth } from '@/context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export const GoogleAuthButton = () => {
    // Dùng setUser và các hàm từ AuthContext
    const { loginWithGoogleToken } = useAuth(); // Bạn có thể viết thêm hàm này trong AuthContext tương tự hàm login

    const handleSuccess = async (credentialResponse) => {
        try {
            // credentialResponse.credential chính là idToken
            const data = await authService.googleLogin(credentialResponse.credential);
            const token = data.result.token;
            localStorage.setItem('token', token);

            // Xử lý fetch MyInfo giống hệt login thường
            window.location.href = '/';
        } catch (error) {
            console.error("Google Login failed", error);
        }
    };

    return (
        <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.log('Login Failed')}
            useOneTap
        />
    );
};