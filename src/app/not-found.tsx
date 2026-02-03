import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h2 className="text-4xl font-bold text-red-500 mb-4">
        404 - Page Not Found
      </h2>
      <p className="text-gray-400 mb-8">
        We couldn't find the page you were looking for.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition"
      >
        Return Home
      </Link>
    </div>
  );
}
