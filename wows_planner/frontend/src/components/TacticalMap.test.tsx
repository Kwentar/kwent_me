import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TacticalMap } from './TacticalMap'
import { ToolType } from '../types'

describe('TacticalMap - Reserve & Pings', () => {
  const mockActiveLayer = {
    id: 'layer-1',
    name: 'Base',
    items: [],
    isVisible: true
  }

  const defaultProps = {
    activeLayer: mockActiveLayer,
    selectedTool: ToolType.POINTER,
    onUpdateLayer: vi.fn(),
    shipConfig: { color: 'red', label: '' },
    pings: [],
    onPing: vi.fn(),
    onInteractionStart: vi.fn(),
    onInteractionEnd: vi.fn()
  }

  it('should not allow pings in the reserve area (Y < 0)', () => {
    const { getByText } = render(
      <TacticalMap {...defaultProps} selectedTool={ToolType.PING} />
    )
    
    const container = document.querySelector('.cursor-crosshair')!
    
    // Simulate click above map (in top reserve)
    // We need to mock getBoundingClientRect for coordinate calculation
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 100,
      width: 1000,
      height: 1000,
      bottom: 1100,
      right: 1000,
      x: 0,
      y: 100,
      toJSON: () => {}
    })

    fireEvent.pointerDown(container, { clientX: 500, clientY: 50, isPrimary: true }) // 50px is above top (100px)

    expect(defaultProps.onPing).not.toHaveBeenCalled()
  })

  it('should allow pings on the actual map area (0 <= Y <= 100)', () => {
    const onPing = vi.fn()
    render(<TacticalMap {...defaultProps} selectedTool={ToolType.PING} onPing={onPing} />)
    
    const container = document.querySelector('.cursor-crosshair')!
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 1000, height: 1000, bottom: 1000, right: 1000, x: 0, y: 0, toJSON: () => {}
    })

    fireEvent.pointerDown(container, { clientX: 500, clientY: 500, isPrimary: true })

    expect(onPing).toHaveBeenCalledWith(50, 50)
  })
})
