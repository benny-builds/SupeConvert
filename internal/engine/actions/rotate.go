package actions

import (
	"image"
	"image/color"

	"github.com/disintegration/imaging"
)

// RotateAction rotates an image by specified angle in degrees.
type RotateAction struct {
	Angle float64 `json:"angle"` // 90, 180, 270 or arbitrary degrees
}

func NewRotateAction(angle float64) *RotateAction {
	return &RotateAction{Angle: angle}
}

func (r *RotateAction) Name() string {
	return "Rotate"
}

func (r *RotateAction) Apply(img image.Image) (image.Image, error) {
	if img == nil {
		return nil, nil
	}

	angle := r.Angle
	for angle < 0 {
		angle += 360
	}
	for angle >= 360 {
		angle -= 360
	}

	switch angle {
	case 0:
		return img, nil
	case 90:
		return imaging.Rotate270(img), nil // imaging counter-clockwise fix
	case 180:
		return imaging.Rotate180(img), nil
	case 270:
		return imaging.Rotate90(img), nil
	default:
		return imaging.Rotate(img, r.Angle, color.Transparent), nil
	}
}
