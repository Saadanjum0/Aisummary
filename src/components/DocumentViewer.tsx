// ... existing code ...
<div className="w-full max-w-5xl mx-auto">
  <div className="flex justify-between items-center mb-4">
    <h1 className="text-2xl font-bold">Your Documents</h1>
    <div className="flex items-center gap-4">
      <Button variant="outline" onClick={() => setView('grid')}>
        <GridIcon className="h-4 w-4" />
      </Button>
      <Button variant="outline" onClick={() => setView('list')}>
        <ListIcon className="h-4 w-4" />
      </Button>
    </div>
  </div>
  {/* Remove the tag filter section here */}
  <div className="grid gap-4">
    {/* Your document list/grid content */}
  </div>
</div>
// ... existing code ...