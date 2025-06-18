import React from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full py-6 bg-slate-900 text-slate-400 border-t border-slate-700">
      <div className="container mx-auto px-4">
        <motion.div 
          className="flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 text-sm">
            <span>채움 : 문장 퀴즈 게임</span>
            <Heart className="h-4 w-4 text-pink-500" />
            <span>&copy; {new Date().getFullYear()} MindBlowing</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;