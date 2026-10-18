import { PAYMENT_METHODS } from "./config";
import "./PaymentInfo.css";

export default function PaymentInfo() {
  return (
    <div className="pay-grid">
      {PAYMENT_METHODS.map((item) => (
        <div className="pay-card" key={item.code}>
          <small>{item.title}</small>
          <strong>{item.method}</strong>
          <span className="pay-detail">{item.detail}</span>
          <p>{item.note}</p>
        </div>
      ))}
    </div>
  );
}
