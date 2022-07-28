#!/usr/bin/env bash
set -e

OUT_FILE='src/_dagitty.js'
COMMIT="ca4ec745ccfeaf8d283543c978e3691178748279"

echo 'var _ = require("underscore");' > "${OUT_FILE}"

FILES=(
    'graph/Class.js'
    'graph/Hash.js'
    'graph/Graph.js'
    'graph/GraphAnalyzer.js'
    'graph/GraphLayouter.js'
    'graph/GraphParser.js'
    'graph/GraphTransformer.js'
    # 'graph/GraphGenerator.js' - no file depends on it in v3
    'graph/ObservedGraph.js'
    # 'graph/GraphSerializer.js' - only needed for `toString()` method
    # 'graph/FlowAlgorithm.js' - no file depends on it in v3
    'graph/MPolynomials.js'
    # 'graph/RUtil.js'
    'parser/GraphDotParser.js'
    'gui/GraphGUI_SVG.js'
    'gui/GraphGUI_View.js'
    'gui/GraphGUI_Controller.js'
)

for file in "${FILES[@]}"
do
    wget "https://raw.githubusercontent.com/jtextor/dagitty/${COMMIT}/jslib/${file}" -O ->> "${OUT_FILE}"
    echo "" >> "${OUT_FILE}"
done

# GraphParser is exported, but not a global (though expected as a global by GraphParser)
echo 'var GraphDotParser = this.GraphDotParser;' >> "${OUT_FILE}"
# GraphParser is not exported (only a global)
echo 'this.GraphParser = GraphParser;' >> "${OUT_FILE}"
# DAGittyController is not exported (only a global)
echo 'this.DAGittyController = DAGittyController;' >> "${OUT_FILE}"
