import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import LoginHeader from "./components/LoginHeader";
import LoginForm from "./components/LoginForm";
import { motion } from "framer-motion";

const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = localStorage.getItem("auth_token");
    if (isAuthenticated === "true") {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Sign In - CRM</title>
        <meta
          name="description"
          content="Sign in to your Aajneeti Crm account to access your sales pipeline, customer data, and CRM tools."
        />
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative min-h-screen bg-background grid grid-cols-1 lg:grid-cols-2"
      >
        {/* Left SIDE - VISUAL */}
        <div className="hidden lg:flex relative items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#312e81] text-white">
          <motion.img
            src="/assets/images/aajneeti-logo.png"
            alt="crm visual"
            initial={{ opacity: 0, x: -40, y: 40 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="absolute top-4 left-4 w-50 pointer-events-none rounded"
          />
          {/* 🔲 Grid Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(#ffffff20_1px,transparent_1px),linear-gradient(90deg,#ffffff20_1px,transparent_1px)] bg-[size:40px_40px]" />

          {/* 🌌 Glow Background */}
          <div className="absolute top-[-80px] right-[-80px] w-[300px] h-[300px] bg-indigo-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-[-100px] left-[-100px] w-[350px] h-[350px] bg-blue-500/20 rounded-full blur-3xl" />

          {/* 🧊 Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-10 max-w-md text-center"
          >
            <h1 className="text-4xl font-bold mb-4 tracking-tight">
              Manage Leads. Track Teams. Scale Faster.
            </h1>
            <p className="text-sm text-white/80 leading-relaxed">
              Build your sales pipeline with AAJneeti CRM. Track leads, automate follow-ups, monitor team performance, and access real-time insights - all from one intelligent dashboard.
            </p>
          </motion.div>

          {/* 🚀 Floating Image - Bottom Left */}
          <motion.img
            src="/assets/images/Img1.png"
            alt="crm visual"
            initial={{ opacity: 0, x: -40, y: 40 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="absolute bottom-40 left-10 w-64 opacity-80 drop-shadow-2xl pointer-events-none rounded"
          />

          {/* 🌐 Floating Image - Top Right */}
          <motion.img
            src="/assets/images/Img2.png"
            alt="crm visual"
            initial={{ opacity: 0, x: 40, y: -40 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute top-40 right-10 w-64 opacity-80 drop-shadow-2xl pointer-events-none rounded"
          />

          {/* ✨ Subtle Floating Animation */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute bottom-10 left-10 w-40 h-40"
          />
          {/* 🚀 Rocket - Center Accent */}
          <motion.img
            src="/assets/images/rocket.png"
            alt="rocket"
            initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0, y: [0, -10, 0] }}
            transition={{
              delay: 0.5,
              duration: 0.8,
              y: { duration: 4, repeat: Infinity },
            }}
            className="absolute z-0 w-28 opacity-90 drop-shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
            style={{
              bottom: "10%",
              right: "10%",
              transform: "translateX(-50%)",
            }}
          />
        </div>

        {/* Right LOGIN */}
        <motion.div
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex items-center justify-center p-6 lg:p-12"
        >
          <div className="w-full max-w-md">
            {/* Logo / Branding */}

            {/* Card */}
            <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 animate-border shadow-[0_0_25px_rgba(99,102,241,0.4)]">
              <div className="bg-card rounded-2xl p-8 space-y-6">
                <LoginHeader />
                <LoginForm />
              </div>
            </div>

            {/* Footer */}
            <p className="mt-6 text-xs text-center text-muted-foreground">
              © {new Date().getFullYear()} Aajneeti Connect Ltd. All rights
              reserved.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default LoginPage;
