package fileutil

import (
	"os"
	"path/filepath"
	"strings"
)

var extendedFormatsList = []string{
	// 520+ Registered Input Extensions for 500+ Format Variants
	".3ds", ".3g2", ".3gp", ".3gpp", ".3fr", ".a", ".aa", ".aai", ".aac", ".ac3", ".acbm", ".acc", ".ace", ".act", ".adts", ".aea", ".aep", ".aet", ".afphoto", ".afdesign", ".afpub", ".agif", ".ai", ".ait", ".aiff", ".alias", ".als", ".amf", ".amr", ".ani", ".anim", ".apng", ".apx", ".arw", ".ari", ".art", ".artw", ".arml", ".asc", ".asf", ".astc", ".asx", ".atk", ".avchd", ".avi", ".avif", ".avifs", ".avs",
	".b1", ".b64", ".ba", ".bam", ".bay", ".bct", ".bdf", ".bfl", ".bgr", ".bgra", ".bgro", ".bik", ".bik2", ".bin", ".bld", ".blend", ".blend1", ".blp", ".bmp", ".bmp2", ".bmp3", ".bpg", ".brg", ".bsp", ".bwb",
	".c4d", ".cad", ".cai", ".cal", ".cals", ".cap", ".canvas", ".caption", ".cbr", ".cbz", ".cbt", ".cb7", ".ccx", ".cdt", ".cdx", ".cdr", ".cg", ".cgm", ".cin", ".cip", ".clip", ".cmyk", ".cmyka", ".cmx", ".cpt", ".crw", ".cr2", ".cr3", ".crx", ".cs", ".ct", ".ctx", ".cur", ".cut", ".cvs",
	".dc2", ".dcm", ".dcm30", ".dcr", ".dcx", ".dct", ".dds", ".ddf", ".dfont", ".dib", ".dic", ".dicm", ".djv", ".djvu", ".dng", ".doc", ".docx", ".dot", ".dotx", ".dpx", ".drf", ".dsc", ".dtcp", ".dvi", ".dwg", ".dwt", ".dxf", ".dxt1", ".dxt2", ".dxt3", ".dxt4", ".dxt5",
	".ecw", ".emf", ".emfs", ".emz", ".eot", ".epi", ".eps", ".eps2", ".eps3", ".epsf", ".epsi", ".ept", ".erf", ".es", ".esd", ".exr", ".ext",
	".f4v", ".farbfeld", ".fax", ".fbx", ".fct", ".ff", ".fff", ".ffm", ".fig", ".fit", ".fits", ".fl32", ".flac", ".flc", ".fli", ".flif", ".flv", ".fmp", ".fmv", ".fpx", ".ftree", ".fts", ".fxt",
	".g3", ".g4", ".gbr", ".gcode", ".ged", ".ggr", ".gif", ".gif87", ".gim", ".glb", ".gltf", ".gmb", ".gpd", ".gph", ".gpr", ".grib", ".grib2", ".gradient", ".gray", ".graya", ".group4",
	".h264", ".h265", ".hald", ".ham", ".ham6", ".ham8", ".hdr", ".hdf", ".hdf5", ".heic", ".heics", ".heif", ".heifs", ".hgl", ".hrz", ".htm", ".html",
	".icb", ".icns", ".ico", ".icon", ".idml", ".iff", ".iff2", ".iges", ".igs", ".iiq", ".ilbm", ".ilm", ".img", ".imp", ".indd", ".inline", ".ipl", ".ipx", ".iso", ".it", ".itg", ".iv", ".ivf",
	".j2c", ".j2k", ".jaf", ".jas", ".jbf", ".jbr", ".jfif", ".jng", ".jnx", ".jp2", ".jpe", ".jpeg", ".jpg", ".jpf", ".jpm", ".jps", ".jpt", ".jpx", ".jxl",
	".k25", ".kdc", ".kfx", ".kml", ".kmz", ".kra", ".ksp", ".ktp", ".ktx", ".ktx2",
	".label", ".lbm", ".lfp", ".lft", ".lit", ".lrf", ".lwo", ".lws", ".lyr", ".lzo",
	".m1v", ".m2t", ".m2ts", ".m2v", ".m4a", ".m4p", ".m4v", ".mac", ".magick", ".map", ".mask", ".mat", ".matte", ".max", ".mb", ".mbf", ".mch", ".mdc", ".mef", ".mesh", ".mng", ".mif", ".miff", ".mka", ".mkv", ".mlp", ".mml", ".mobi", ".mod", ".moov", ".mos", ".mov", ".mp2", ".mp3", ".mp4", ".mpc", ".mpeg", ".mpg", ".mpo", ".mpr", ".mpt", ".mpv", ".mrw", ".msl", ".msrvg", ".mtl", ".mtv", ".mvg", ".mvr", ".mws",
	".nef", ".net", ".nff", ".nii", ".nii.gz", ".nif", ".nrw", ".ntf", ".null", ".nws",
	".obj", ".odb", ".odg", ".odp", ".ods", ".odt", ".ofa", ".off", ".ogg", ".ogv", ".ogx", ".ogm", ".omf", ".ora", ".orf", ".otb", ".otf", ".otg", ".otp", ".ots", ".ott",
	".p7", ".paf", ".pak", ".palm", ".pam", ".pbm", ".pcc", ".pcd", ".pcds", ".pcl", ".pct", ".pcx", ".pdd", ".pdf", ".pdn", ".pef", ".pes", ".pfa", ".pfb", ".pfm", ".pfr", ".pgf", ".pgm", ".pgx", ".phm", ".picon", ".pict", ".pix", ".pjp", ".pjpeg", ".pl", ".plt", ".ply", ".png", ".png00", ".png24", ".png32", ".png48", ".png64", ".png8", ".pnm", ".pnt", ".pntg", ".ppm", ".pptx", ".ppsx", ".ps", ".ps2", ".ps3", ".psb", ".psd", ".ptif", ".pvr", ".pwi", ".pwt",
	".qcf", ".qif", ".qoi", ".qt", ".qti", ".qtif", ".qtz",
	".rad", ".raf", ".ras", ".raw", ".rgb", ".rgb565", ".rgba", ".rgbf", ".rgbo", ".rla", ".rle", ".rm", ".rmvb", ".r3d", ".rw2", ".rwl", ".rwz",
	".s25", ".sai", ".sai2", ".sat", ".scad", ".sct", ".scr", ".sdw", ".sgi", ".sgi8", ".shtml", ".sid", ".six", ".simg", ".sketch", ".skp", ".slk", ".sldprt", ".sldasm", ".smf", ".spn", ".sr2", ".srf", ".srw", ".stegano", ".step", ".stp", ".stl", ".sun", ".svg", ".svgz", ".swf", ".swc",
	".tbn", ".tga", ".tjp", ".tif", ".tiff", ".tim", ".tm2", ".tpic", ".trp", ".ts", ".tsv", ".ttf", ".txt",
	".uil", ".usd", ".usda", ".usdc", ".usdz", ".uyvy",
	".vda", ".vcf", ".vcd", ".vfb", ".vfc", ".vff", ".vfs", ".vhd", ".vicar", ".vid", ".viff", ".vips", ".vlt", ".vob", ".vrml", ".vsd", ".vsdx", ".vst", ".vtf", ".vvue", ".vue",
	".wbmp", ".wbm", ".webm", ".webp", ".wfb", ".wmf", ".wmfs", ".wmv", ".wmz", ".wpg", ".wrl", ".wts",
	".x3d", ".x3f", ".xaf", ".xam", ".xar", ".xbm", ".xcf", ".xcf.bz2", ".xcf.gz", ".xpm", ".xps", ".xwd", ".xv",
	".ycbcr", ".ycbcra", ".yuv", ".zbr",
}

var supportedExtensions = func() map[string]bool {
	m := make(map[string]bool, len(extendedFormatsList))
	for _, ext := range extendedFormatsList {
		m[ext] = true
	}
	return m
}()

// IsImageFile checks if file has a supported image extension.
func IsImageFile(path string) bool {
	ext := strings.ToLower(filepath.Ext(path))
	return supportedExtensions[ext]
}

// DiscoverImages walks a directory recursively (or single directory if recursive=false)
// and returns all supported image file paths.
func DiscoverImages(rootDir string, recursive bool) ([]string, error) {
	var images []string

	if !recursive {
		entries, err := os.ReadDir(rootDir)
		if err != nil {
			return nil, err
		}
		for _, entry := range entries {
			if !entry.IsDir() {
				fullPath := filepath.Join(rootDir, entry.Name())
				if IsImageFile(fullPath) {
					images = append(images, fullPath)
				}
			}
		}
		return images, nil
	}

	err := filepath.Walk(rootDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && IsImageFile(path) {
			images = append(images, path)
		}
		return nil
	})

	return images, err
}
