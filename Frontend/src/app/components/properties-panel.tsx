interface PropertiesPanelProps {
  selectedNotes: number[];
  onPropertyChange: (property: string, value: any) => void;
}

export function PropertiesPanel({
  selectedNotes,
  onPropertyChange,
}: PropertiesPanelProps) {
  const hasSelection = selectedNotes.length > 0;

  return (
    <div className="w-72 bg-sidebar border-l border-sidebar-border overflow-y-auto">
      <div className="p-6">
        <h3 className="font-semibold text-lg mb-6">Note Properties</h3>

        {!hasSelection ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">
              Select a note to view and edit its properties
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-sm">
              <p className="text-accent-foreground">
                {selectedNotes.length} note{selectedNotes.length > 1 ? 's' : ''} selected
              </p>
            </div>

            {/* Pitch */}
            <div>
              <label className="block text-sm mb-2">Pitch</label>
              <select
                onChange={(e) => onPropertyChange('pitch', e.target.value)}
                className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option>C4</option>
                <option>D4</option>
                <option>E4</option>
                <option>F4</option>
                <option>G4</option>
                <option>A4</option>
                <option>B4</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm mb-2">Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '𝅝', value: 'whole', title: 'Whole Note' },
                  { label: '𝅗𝅥', value: 'half', title: 'Half Note' },
                  { label: '♩', value: 'quarter', title: 'Quarter Note' },
                  { label: '♪', value: 'eighth', title: 'Eighth Note' },
                ].map((duration) => (
                  <button
                    key={duration.value}
                    onClick={() => onPropertyChange('duration', duration.value)}
                    className="px-3 py-2 bg-muted hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors text-xl"
                    title={duration.title}
                  >
                    {duration.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamics */}
            <div>
              <label className="block text-sm mb-2">Dynamics</label>
              <select
                onChange={(e) => onPropertyChange('dynamics', e.target.value)}
                className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option>pp - Pianissimo</option>
                <option>p - Piano</option>
                <option>mp - Mezzo Piano</option>
                <option>mf - Mezzo Forte</option>
                <option>f - Forte</option>
                <option>ff - Fortissimo</option>
              </select>
            </div>

            {/* Articulation */}
            <div>
              <label className="block text-sm mb-2">Articulation</label>
              <div className="space-y-2">
                {[
                  { label: 'Staccato', value: 'staccato' },
                  { label: 'Legato', value: 'legato' },
                  { label: 'Accent', value: 'accent' },
                  { label: 'Tenuto', value: 'tenuto' },
                ].map((articulation) => (
                  <label key={articulation.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      onChange={(e) => onPropertyChange('articulation', {
                        type: articulation.value,
                        enabled: e.target.checked,
                      })}
                      className="accent-accent"
                    />
                    <span className="text-sm">{articulation.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Velocity (Volume) */}
            <div>
              <label className="block text-sm mb-2">Velocity</label>
              <input
                type="range"
                min="0"
                max="127"
                defaultValue="64"
                onChange={(e) => onPropertyChange('velocity', Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Soft</span>
                <span>Loud</span>
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => onPropertyChange('delete', selectedNotes)}
              className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
