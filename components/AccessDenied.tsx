"use client";

import { IconLock, IconMail } from "@tabler/icons-react";
import { motion } from "framer-motion";

interface AccessDeniedProps {
    pageName?: string;
}

export default function AccessDenied({ pageName }: AccessDeniedProps) {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full text-center"
            >
                <div className="relative mx-auto w-24 h-24 mb-6">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/20 animate-pulse" />
                    <div className="relative h-full w-full rounded-3xl bg-white border border-red-200 flex items-center justify-center shadow-lg">
                        <IconLock size={40} className="text-red-500" />
                    </div>
                </div>

                <h1 className="text-2xl font-extrabold text-neutral-900 mb-2">
                    Access Denied
                </h1>

                {pageName && (
                    <p className="text-neutral-600 mb-4">
                        You don&apos;t have permission to access <strong className="text-neutral-900">{pageName}</strong>.
                    </p>
                )}

                <div className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 mb-6">
                    <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
                        <IconMail size={20} />
                        <span className="font-bold">Contact Administrator</span>
                    </div>
                    <p className="text-sm text-red-600/80">
                        Please contact your system administrator to request access to this page.
                    </p>
                </div>

                <a
                    href="/dashboard"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#E01E1F] to-[#FEA519] text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:opacity-90 transition-all"
                >
                    Return to Dashboard
                </a>
            </motion.div>
        </div>
    );
}
