require('IRdisplay', quietly = TRUE)


display_dagitty <- function(
    obj,
    height = 500,
    width = NULL,
    mutable = FALSE
) {
    bundle <- list(
        data=list(
            'application/x.dagitty.dag' = toString(obj)
        ),
        metadata=list(
            height = ifelse(is.null(height), 'unset', paste0(height, 'px')),
            width = ifelse(is.null(width), 'unset', paste0(width, 'px')),
            mutable = mutable
        )
    )
    IRdisplay::publish_mimebundle(bundle$data, bundle$metadata)
}
