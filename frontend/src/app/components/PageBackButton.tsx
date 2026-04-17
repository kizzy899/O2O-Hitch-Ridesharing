import { useNavigate } from "react-router-dom";

type PageBackButtonProps = {
  fallback: string;
};

export function PageBackButton({ fallback }: PageBackButtonProps) {
  const navigate = useNavigate();

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  }

  return (
    <button type="button" className="back-action" onClick={goBack}>
      返回
    </button>
  );
}
