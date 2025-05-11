import React from 'react';
import { Separator } from "@/components/ui/separator";

interface SummaryViewerProps {
  summary: string;
  keyPoints: string[];
}

const SummaryViewer: React.FC<SummaryViewerProps> = ({ summary, keyPoints }) => {
  // Improved function to clean and format headings
  const formatHeadings = (text: string) => {
    // Replace ** format with proper styling
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  // Clean up and filter key points
  const cleanKeyPoints = keyPoints
    .filter(point => point.trim() !== '')
    .filter((point, index, self) => {
      // Remove duplicates and empty section headers
      const cleanPoint = point.replace(/^[#\s-]*/, '').trim();
      return (
        cleanPoint.length > 0 &&
        !cleanPoint.toLowerCase().includes('key concepts & details') &&
        self.findIndex(p => p.replace(/^[#\s-]*/, '').trim() === cleanPoint) === index
      );
    });

  // Separate key concepts and main takeaways
  const conceptsPoints: string[] = [];
  const takeawaysPoints: string[] = [];
  let inTakeawaysSection = false;

  cleanKeyPoints.forEach(point => {
    // Check if this point is the Main Takeaways header
    if (point.toLowerCase().includes('main takeaways') || 
        point.match(/^#{1,3}\s+main\s+takeaways/i)) {
      inTakeawaysSection = true;
      return;
    }
    
    // Check if this is a new section header (after Main Takeaways)
    if (inTakeawaysSection && point.match(/^#{1,3}\s+/)) {
      inTakeawaysSection = false;
    }
    
    // Add to appropriate array
    if (inTakeawaysSection) {
      takeawaysPoints.push(point);
    } else {
      conceptsPoints.push(point);
    }
  });

  // Improved logic to group key points by section
  const groupedConceptPoints = conceptsPoints.reduce<{ [key: string]: string[] }>((acc, point) => {
    // Handle heading format (### Section Title)
    if (/^#{1,3}\s+(.+)/.test(point)) {
      const sectionName = point.replace(/^#{1,3}\s+/, '').trim();
      if (sectionName && !acc[sectionName]) {
        acc[sectionName] = [];
      }
      return acc;
    }
    
    // Handle **Section Title:** format
    const boldHeaderMatch = point.match(/^\*\*([^:]+):\*\*\s*(.*)$/);
    if (boldHeaderMatch && boldHeaderMatch[1].trim()) {
      const [, sectionName, content] = boldHeaderMatch;
      if (!acc[sectionName.trim()]) {
        acc[sectionName.trim()] = [];
      }
      if (content && content.trim()) {
        acc[sectionName.trim()].push(content.trim());
      }
      return acc;
    }
    
    // Handle regular "Section: Content" format
    if (point.includes(':')) {
      const splitIndex = point.indexOf(':');
      const section = point.substring(0, splitIndex).trim();
      const content = point.substring(splitIndex + 1).trim();
      
      if (section && section.length < 50) { // Ensure it's likely a section header, not just text with a colon
        if (!acc[section]) {
          acc[section] = [];
        }
        if (content) {
          acc[section].push(content);
        }
        return acc;
      }
    }
    
    // If no section found, add to General Points
    if (!acc['General Points']) {
      acc['General Points'] = [];
    }
    acc['General Points'].push(point.trim());
    return acc;
  }, {});

  // Process takeaways - they're typically bullet points, so we'll keep them flat
  const formattedTakeaways = takeawaysPoints
    .filter(point => point.trim().length > 0)
    .map(point => {
      // Remove bullet prefix if present
      return point.replace(/^[-*•]\s*/, '').trim();
    })
    .filter(point => point.length > 0);

  // Filter out sections with no content
  const filteredSections = Object.entries(groupedConceptPoints).filter(([_, points]) => points.length > 0);

  return (
    <div className="space-y-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      {/* Overview Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Overview
        </h3>
        <div 
          className="text-gray-700 dark:text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatHeadings(summary) }}
        />
      </div>

      {filteredSections.length > 0 && (
        <>
          <Separator className="my-6" />

          {/* Key Points Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Key Concepts & Details
            </h3>
            {filteredSections.map(([section, points], index) => (
              <div key={section} className="space-y-3">
                <h4 className="text-base font-medium text-gray-800 dark:text-gray-200">
                  {section}
                </h4>
                <ul className="space-y-3">
                  {points.map((point, pointIndex) => (
                    <li
                      key={pointIndex}
                      className="text-gray-700 dark:text-gray-300 leading-relaxed pl-4 border-l-2 border-gray-200 dark:border-gray-600"
                      dangerouslySetInnerHTML={{ __html: formatHeadings(point) }}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {formattedTakeaways.length > 0 && (
        <>
          <Separator className="my-6" />

          {/* Main Takeaways Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Main Takeaways
            </h3>
            <ul className="space-y-3">
              {formattedTakeaways.map((takeaway, index) => (
                <li 
                  key={index} 
                  className="text-gray-700 dark:text-gray-300 leading-relaxed pl-4 border-l-2 border-purple-300 dark:border-purple-700"
                  dangerouslySetInnerHTML={{ __html: formatHeadings(takeaway) }}
                />
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default SummaryViewer;