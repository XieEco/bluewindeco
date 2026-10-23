# BlueWindEco

Website: <https://xieeco.github.io/bluewindeco/>.

This GitHub Pages application runs entirely in the visitor's browser. The map,
cell query, rectangle summaries, scenario comparisons and Excel export do not
depend on a local computer, Python server or temporary tunnel.

`data/manifest.json`, the `core.bin.gz.part*` files and the five `impact_*.bin.gz`
files are public derived research data. Anyone can download or reconstruct
their numeric contents. The original MATLAB file, NetCDF file, strategy
workbook, encryption key and Python backend are not required for website use
and are not included in this public repository.

To regenerate the data after changing the research inputs, run
`bluewindeco/tools/build_static_pack.py` from the private source project,
verify its parity checks and publish the resulting `data/` files together.

The site uses only relative URLs, so it also works at a GitHub Pages project
path (`/<repository>/`). GitHub Pages availability remains subject to GitHub's
service availability and published usage limits.
