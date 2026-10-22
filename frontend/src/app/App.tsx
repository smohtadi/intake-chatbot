import { RouterProvider } from "react-router-dom";
import { Provider as ReactReduxProvider } from "react-redux";
import { store } from "@/store/store";
import router from "@/app/router";
import { AuthProvider } from "@/store/auth/auth-provider";
import ToastRegion from "@/components/ui/toast/toast-region";

export default function App() {
  return (
    <ReactReduxProvider store={store}>
      <AuthProvider>
        <ToastRegion />
        <RouterProvider router={router} />
      </AuthProvider>
    </ReactReduxProvider>
  );
}
