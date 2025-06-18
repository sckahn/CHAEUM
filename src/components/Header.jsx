import React from "react";
import { motion } from "framer-motion";
import { Sparkles, BarChart, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = ({ onOpenStatsModal }) => {
  const { setTheme } = useTheme();

  return (
    <header className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white dark:from-gray-800 dark:to-black">
      <div className="container mx-auto px-4 flex items-center justify-center relative">
        <motion.div 
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="flex items-center gap-2 mb-1 sm:mb-2"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-300" />
            <Link to="/" className="cursor-pointer">
              <h1 className="text-3xl sm:text-4xl font-bold">채움</h1>
            </Link>
            <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-300" />
          </motion.div>
          <p className="text-sm sm:text-base text-blue-100 dark:text-gray-300 max-w-2xl hidden sm:block">
            상대가 보낸 문장 퀴즈를 풀어보세요!
          </p>
        </motion.div>

        <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                size="icon"
                className="bg-white/20 hover:bg-white/30 text-white border-white/50 hover:border-white rounded-full w-10 h-10 sm:w-12 sm:h-12"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="outline"
            size="icon"
            onClick={onOpenStatsModal}
            className="bg-white/20 hover:bg-white/30 text-white border-white/50 hover:border-white rounded-full w-10 h-10 sm:w-12 sm:h-12"
            aria-label="통계 보기"
          >
            <BarChart className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
