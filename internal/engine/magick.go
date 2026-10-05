package engine

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

// MagickEngine provides fallback conversion using portable ImageMagick sidecar binary
type MagickEngine struct {
	executablePath string
	available      bool
}

var globalMagickEngine *MagickEngine

func init() {
	globalMagickEngine = NewMagickEngine()
}

func NewMagickEngine() *MagickEngine {
	me := &MagickEngine{}
	me.detectExecutable()
	return me
}

func (me *MagickEngine) detectExecutable() {
	// Check app execution dir for bin/magick.exe or magick.exe
	execDir, err := os.Executable()
	if err == nil {
		baseDir := filepath.Dir(execDir)
		candidates := []string{
			filepath.Join(baseDir, "bin", "magick.exe"),
			filepath.Join(baseDir, "magick.exe"),
			filepath.Join(baseDir, "bin", "magick"),
			filepath.Join(baseDir, "magick"),
		}
		if runtime.GOOS == "windows" {
			candidates = append(candidates, "C:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI\\magick.exe")
		}
		for _, c := range candidates {
			if _, err := os.Stat(c); err == nil {
				me.executablePath = c
				me.available = true
				return
			}
		}
	}

	// Check system PATH
	path, err := exec.LookPath("magick")
	if err == nil {
		me.executablePath = path
		me.available = true
		return
	}
}

func (me *MagickEngine) IsAvailable() bool {
	return me.available
}

func (me *MagickEngine) Convert(inputPath, outputPath string, quality int, resizeW, resizeH int) error {
	if !me.available {
		return fmt.Errorf("ImageMagick engine not available")
	}

	args := []string{inputPath}

	if resizeW > 0 || resizeH > 0 {
		var resizeArg string
		if resizeW > 0 && resizeH > 0 {
			resizeArg = fmt.Sprintf("%dx%d!", resizeW, resizeH)
		} else if resizeW > 0 {
			resizeArg = fmt.Sprintf("%dx", resizeW)
		} else {
			resizeArg = fmt.Sprintf("x%d", resizeH)
		}
		args = append(args, "-resize", resizeArg)
	}

	ext := strings.ToLower(filepath.Ext(outputPath))
	if (ext == ".jpg" || ext == ".jpeg" || ext == ".webp" || ext == ".avif" || ext == ".heic") && quality > 0 {
		args = append(args, "-quality", fmt.Sprintf("%d", quality))
	}

	args = append(args, outputPath)

	cmd := exec.Command(me.executablePath, args...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("magick failed: %w (stderr: %s)", err, stderr.String())
	}

	return nil
}
