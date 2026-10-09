#!/usr/bin/env bash
set -e

OUT_FILE='src/_dagitty.js'
# On the `frontdoor` branch, not `master`: master's history for jslib/gui
# dropped the mid-2023 merge of jtextor/dagitty#64 (offsetX/offsetY pointer
# positions, needed to embed dagitty in a scrollable or positioned element)
# during an unrelated "webserver migration". frontdoor still has it, and
# nothing on master has touched jslib/graph, jslib/parser or jslib/gui since
# frontdoor's last commit except one unrelated 4-line simplification.
COMMIT="acfc5db2ce474ebb6d957c0d0f9f921a7b74fe98"

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
