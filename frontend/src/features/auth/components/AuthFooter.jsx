import React from "react";
import { Link } from "react-router-dom";

export default function AuthFooter({ text, linkTo, linkLabel }) {
  return (
    <div className="auth-footer">
      {text} <Link to={linkTo}>{linkLabel}</Link>
    </div>
  );
}
