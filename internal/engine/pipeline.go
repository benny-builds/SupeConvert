package engine

import "image"

// Pipeline represents an ordered sequence of image transformations.
type Pipeline struct {
	Actions []Action `json:"actions"`
}

// NewPipeline creates a new empty Pipeline.
func NewPipeline(actions ...Action) *Pipeline {
	return &Pipeline{
		Actions: actions,
	}
}

// AddAction appends an Action to the pipeline.
func (p *Pipeline) AddAction(action Action) {
	p.Actions = append(p.Actions, action)
}

// Run executes all actions in sequence on the given image.
func (p *Pipeline) Run(img image.Image) (image.Image, error) {
	var err error
	current := img
	for _, action := range p.Actions {
		current, err = action.Apply(current)
		if err != nil {
			return nil, err
		}
	}
	return current, nil
}
