package engine

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"supeconvert/internal/engine/actions"
)

type ActionData struct {
	Type   string          `json:"type"`
	Params json.RawMessage `json:"params"`
}

type Preset struct {
	Name    string       `json:"name"`
	Actions []ActionData `json:"actions"`
}

// SavePreset serializes pipeline actions into a JSON preset file in target dir.
func SavePreset(presetPath string, name string, pipeline *Pipeline) error {
	var actionDatas []ActionData

	for _, act := range pipeline.Actions {
		actName := act.Name()
		data, err := json.Marshal(act)
		if err != nil {
			return fmt.Errorf("failed to marshal action %s: %w", actName, err)
		}
		actionDatas = append(actionDatas, ActionData{
			Type:   actName,
			Params: data,
		})
	}

	preset := Preset{
		Name:    name,
		Actions: actionDatas,
	}

	dir := filepath.Dir(presetPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create preset dir: %w", err)
	}

	bytes, err := json.MarshalIndent(preset, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal preset: %w", err)
	}

	return os.WriteFile(presetPath, bytes, 0644)
}

// LoadPreset deserializes a JSON preset file into a Pipeline.
func LoadPreset(presetPath string) (*Pipeline, string, error) {
	bytes, err := os.ReadFile(presetPath)
	if err != nil {
		return nil, "", fmt.Errorf("failed to read preset file: %w", err)
	}

	var preset Preset
	if err := json.Unmarshal(bytes, &preset); err != nil {
		return nil, "", fmt.Errorf("failed to unmarshal preset: %w", err)
	}

	pipeline := NewPipeline()
	for _, item := range preset.Actions {
		var act Action
		switch item.Type {
		case "Resize":
			var r actions.ResizeAction
			if err := json.Unmarshal(item.Params, &r); err != nil {
				return nil, "", err
			}
			act = &r
		case "Rotate":
			var rot actions.RotateAction
			if err := json.Unmarshal(item.Params, &rot); err != nil {
				return nil, "", err
			}
			act = &rot
		case "Crop":
			var cr actions.CropAction
			if err := json.Unmarshal(item.Params, &cr); err != nil {
				return nil, "", err
			}
			act = &cr
		case "Watermark":
			var w actions.WatermarkAction
			if err := json.Unmarshal(item.Params, &w); err != nil {
				return nil, "", err
			}
			act = &w
		case "ColorAdjust":
			var ca actions.ColorAdjustAction
			if err := json.Unmarshal(item.Params, &ca); err != nil {
				return nil, "", err
			}
			act = &ca
		case "ConvertFormat":
			var c actions.ConvertFormatAction
			if err := json.Unmarshal(item.Params, &c); err != nil {
				return nil, "", err
			}
			act = &c
		default:
			return nil, "", fmt.Errorf("unknown action type: %s", item.Type)
		}
		pipeline.AddAction(act)
	}

	return pipeline, preset.Name, nil
}
