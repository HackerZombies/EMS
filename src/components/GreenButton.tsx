import { ButtonHTMLAttributes, FC } from "react";

type ButtonProps = {
  children: React.ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const GreenButton: FC<ButtonProps> = ({ children, ...attributes }) => {
  return (
    <button
      className="flex items-center justify-center gap-1 text-nowrap rounded-full bg-green-600 px-4 py-2 font-medium text-white shadow-lg transition hover:bg-green-500 active:bg-green-700"
      {...attributes}
    >
      {children}
    </button>
  );
};

export default GreenButton;