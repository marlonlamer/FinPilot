import React from "react";

export default function AuthSubmitButton({ loading, buttonText }) {
  return (
    <button className="btn btn-primary" disabled={loading}>
      {buttonText}
    </button>
  );
}
