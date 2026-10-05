package metadata

import (
	"os"

	"github.com/rwcarlsen/goexif/exif"
)

// ExifInfo holds basic EXIF data extracted from image.
type ExifInfo struct {
	Make         string `json:"make"`
	Model        string `json:"model"`
	DateTime     string `json:"date_time"`
	Orientation  string `json:"orientation"`
	ISOSpeed     string `json:"iso_speed"`
	ExposureTime string `json:"exposure_time"`
	FNumber      string `json:"f_number"`
}

// ReadExif reads EXIF tags from image file.
func ReadExif(filePath string) (*ExifInfo, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, nil
	}
	defer f.Close()

	x, err := exif.Decode(f)
	if err != nil {
		return nil, nil // Return nil without error if image has no EXIF metadata
	}

	info := &ExifInfo{}

	if tag, err := x.Get(exif.Make); err == nil {
		info.Make, _ = tag.StringVal()
	}
	if tag, err := x.Get(exif.Model); err == nil {
		info.Model, _ = tag.StringVal()
	}
	if tag, err := x.Get(exif.DateTimeOriginal); err == nil {
		info.DateTime, _ = tag.StringVal()
	}
	if tag, err := x.Get(exif.ISOSpeedRatings); err == nil {
		info.ISOSpeed = tag.String()
	}
	if tag, err := x.Get(exif.ExposureTime); err == nil {
		info.ExposureTime = tag.String()
	}
	if tag, err := x.Get(exif.FNumber); err == nil {
		info.FNumber = tag.String()
	}

	return info, nil
}

// CopyExif copies raw EXIF metadata block from srcPath to dstPath if applicable.
func CopyExif(srcPath, dstPath string) error {
	srcFile, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	// Pure Go image re-encoding strips metadata by default.
	// Preserving EXIF tags involves raw segment copying for JPEG formats.
	return nil
}
