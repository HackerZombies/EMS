export default function Input({ ...attributes }) {
  return (
    <input
      className="rounded-xl border-2 border-gray-600 bg-gray-700 bg-opacity-80 px-4 py-2 text-white shadow-lg outline-none transition placeholder:text-gray-300 hover:bg-opacity-90 focus:border-green-500 focus:bg-opacity-100"
      {...attributes}
    />
  );
}