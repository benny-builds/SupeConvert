package engine

import "image"

// Action represents a single image transformation step.
type Action interface {
	Name() string
	Apply(img image.Image) (image.Image, error)
}
