import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from './App'

// Mocking canvas because Konva/Canvas API is not fully supported in JSDOM
vi.mock('react-konva', () => ({
  Stage: ({ children }: any) => <div data-testid="mock-stage">{children}</div>,
  Layer: ({ children }: any) => <div data-testid="mock-layer">{children}</div>,
  Image: () => <div data-testid="mock-image" />,
  Rect: () => <div data-testid="mock-rect" />,
  Line: () => <div data-testid="mock-line" />,
  Transformer: () => <div data-testid="mock-transformer" />,
}))

describe('Snap (Imedit) Frontend', () => {
  it('renders correctly with sidebar and main area', () => {
    render(<App />)
    
    // Check for title
    expect(screen.getByText(/Kwent Snap/i)).toBeInTheDocument()
    
    // Check for tools
    expect(screen.getByText(/TOOLS/i)).toBeInTheDocument()
    expect(screen.getByText('Brush')).toBeInTheDocument()
    expect(screen.getByText('Rect')).toBeInTheDocument()
    
    // Check for drop area text
    expect(screen.getByText(/Paste or drop an image here/i)).toBeInTheDocument()
  })

  it('contains essential control buttons', () => {
    render(<App />)
    
    expect(screen.getByText(/Open Image/i)).toBeInTheDocument()
    expect(screen.getByText(/Download/i)).toBeInTheDocument()
    expect(screen.getByText(/Clear Drawing/i)).toBeInTheDocument()
  })
})
