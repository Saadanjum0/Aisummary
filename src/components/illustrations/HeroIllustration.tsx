import React from 'react';
import { motion } from 'framer-motion';

const HeroIllustration: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.2 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="relative w-full max-w-md sm:max-w-lg mx-auto mt-8 sm:mt-0">
      {/* Side Card: Keywords/Tags (Left) - Appears slightly behind */}
      <motion.div 
        className="absolute bottom-8 sm:bottom-12 left-0 transform -translate-x-[20%] sm:-translate-x-[25%] z-0 
                   bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-3 sm:p-4 w-40 sm:w-48"
        initial={{ opacity: 0, x: "-30%" }}
        animate={{ opacity: 1, x: "-20%" }}
        transition={{ delay: 0.6, duration: 0.5, ease: "circOut" }}
      >
        <div className="flex items-center mb-2">
          {/* Placeholder for # icon if needed */}
          <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center mr-2 text-blue-500 dark:text-blue-300 text-xs font-bold">#</div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Keywords</h3>
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-1.5">
          {['Machine Learning', 'Data Analysis', 'AI Models'].map(tag => (
            <div key={tag} className="px-1.5 sm:px-2 py-0.5 bg-gray-100 dark:bg-gray-600 rounded-full text-xxs sm:text-xs text-gray-700 dark:text-gray-200">
              {tag}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Side Card: Summary (Right) - Appears slightly behind */}
      <motion.div 
        className="absolute top-8 sm:top-12 right-0 transform translate-x-[20%] sm:translate-x-[25%] z-0 
                   bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-3 sm:p-4 w-48 sm:w-56"
        initial={{ opacity: 0, x: "30%" }}
        animate={{ opacity: 1, x: "20%" }}
        transition={{ delay: 0.4, duration: 0.5, ease: "circOut" }}
      >
        <div className="flex items-center mb-2">
          {/* Placeholder for Summary icon */}
          <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center mr-2 text-blue-500 dark:text-blue-300">
             {/* Simple list/text icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Summary</h3>
        </div>
        <div className="space-y-1 sm:space-y-1.5">
          <div className="h-2 sm:h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full w-full"></div>
          <div className="h-2 sm:h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full w-full"></div>
          <div className="h-2 sm:h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full w-3/4"></div>
        </div>
      </motion.div>

      {/* Main PDF document mock-up */}
      <motion.div 
        className="relative z-10 bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* PDF Header - Light Gray */}
        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2.5 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div> {/* Changed from warning-500 for typical Mac look */}
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">research-paper.pdf</div>
          </div>
        </div>
        
        {/* PDF Content Placeholders - Light Gray bars */}
        <div className="p-5 sm:p-6 relative"> {/* Added relative for central animation positioning within content area */}
          <motion.div 
            className="space-y-2.5 sm:space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div key={`title-${i}`} variants={itemVariants}>
                <div className={`h-4 sm:h-5 bg-gray-200 dark:bg-gray-600 rounded-full ${i === 0 ? 'w-3/4' : (i === 1 ? 'w-1/2' : 'w-2/3')} mb-1 sm:mb-1.5`}></div>
              </motion.div>
            ))}
            {[...Array(5)].map((_, i) => (
              <motion.div key={`line-${i}`} variants={itemVariants} className="space-y-1">
                <div className={`h-2.5 sm:h-3 bg-gray-100 dark:bg-gray-500 rounded-full ${i % 2 === 0 ? 'w-full' : (i % 3 === 0 ? 'w-5/6' : 'w-11/12')}`}></div>
              </motion.div>
            ))}
             <motion.div variants={itemVariants}>
                <div className={`h-4 sm:h-5 bg-gray-200 dark:bg-gray-600 rounded-full w-4/5 mb-1 sm:mb-1.5`}></div>
              </motion.div>
             {[...Array(3)].map((_, i) => (
              <motion.div key={`line2-${i}`} variants={itemVariants} className="space-y-1">
                <div className={`h-2.5 sm:h-3 bg-gray-100 dark:bg-gray-500 rounded-full ${i === 0 ? 'w-full' : (i === 1 ? 'w-11/12' : 'w-3/4')}`}></div>
              </motion.div>
            ))}
          </motion.div>

          {/* Central Layered Translucent Animation - Replaces previous ping */}
          <motion.div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-36 sm:h-36 z-0" /* z-0 to be behind text placeholders if needed */
            initial={{ opacity: 0, scale: 0.5}}
            animate={{ opacity: 1, scale: 1}}
            transition={{delay: 0.5, duration: 0.7}}
           >
            {[0.3, 0.2, 0.1].map((opacity, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full bg-blue-500"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: opacity }}
                transition={{
                  delay: 0.7 + i * 0.2,
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut"
                }}
                style={{ 
                  width: `${100 - i * 25}%`,
                  height: `${100 - i * 25}%`,
                  top: `${i * 12.5}%`,
                  left: `${i * 12.5}%`,
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
      
      {/* Decorative elements - Kept, ensure accent/primary colors are defined for these */}
      <div className="absolute -z-10 top-10 sm:top-20 -left-4 sm:-left-8 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent-100/50 dark:bg-accent-500/10 opacity-70"></div>
      <div className="absolute -z-10 -bottom-5 sm:-bottom-10 right-5 sm:right-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-primary-100/70 dark:bg-primary-500/20 opacity-70"></div>
    </div>
  );
};

export default HeroIllustration; 