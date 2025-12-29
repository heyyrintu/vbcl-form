"use client";

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            <div className="text-center px-6 py-12 max-w-md">
                {/* Offline Icon */}
                <div className="mb-8">
                    <svg
                        className="w-24 h-24 mx-auto text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-.707-7.071M3 3l18 18"
                        />
                    </svg>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-white mb-4">
                    You&apos;re Offline
                </h1>

                {/* Description */}
                <p className="text-gray-300 mb-8 text-lg">
                    It seems you&apos;ve lost your internet connection. Please check your
                    network and try again.
                </p>

                {/* Retry Button */}
                <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                >
                    Try Again
                </button>

                {/* App Info */}
                <div className="mt-12 pt-8 border-t border-white/10">
                    <p className="text-gray-500 text-sm">
                        VBCL Alwar Production Tracker
                    </p>
                </div>
            </div>
        </div>
    );
}
