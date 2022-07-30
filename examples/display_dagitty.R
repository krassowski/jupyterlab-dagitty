require('IRdisplay', quietly = TRUE)


display_dagitty <- function(
    data = NULL,
    path = NULL,
    height = 500,
    width = NULL,
    mutable = FALSE
) {
    if (!is.null(path)) {
        if (!is.null(data)) {
            stop('Please provide either `data` or `path`, not both.')
        }
        data = paste(readLines(path), collapse=  ' ')
    }
    bundle <- list(
        data=list(
            'application/x.dagitty.dag' = toString(data)
        ),
        metadata=list(
            height = ifelse(is.null(height), 'unset', paste0(height, 'px')),
            width = ifelse(is.null(width), 'unset', paste0(width, 'px')),
            mutable = mutable
        )
    )
    IRdisplay::publish_mimebundle(bundle$data, bundle$metadata)
}
