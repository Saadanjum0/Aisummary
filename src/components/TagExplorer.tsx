import React from 'react';

const tags = [
  'Activity Diagrams',
  'Behavioral Models',
  'Class Diagrams',
  'Computer Science',
  'Context Models',
  'Important',
  'Interaction Models',
  'Model-Driven Engineering',
  'Project Management',
  'Question',
  'Review',
  'Sequence Diagrams',
  'Software Development',
  'Software Engineering',
  'State Diagrams'
];

const TagExplorer = () => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">TAG EXPLORER</h2>
      <p className="text-sm text-muted-foreground mb-2">Browse your content by tags</p>
      <div className="flex flex-col gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            className="px-3 py-2 rounded-lg text-sm text-left hover:bg-secondary/80"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagExplorer;