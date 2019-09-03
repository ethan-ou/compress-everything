function setImageSize(event, state) {
    switch(state.resolution) {
        case 0:
            return [800, 800];
        case 1:
            return [1280, 1280];
        case 2:
            return [2048, 2048];
        default:
            return [2048, 2048];
    }
}

export const resizeImages = [2048, 2048];
export const OUTPUT_path = './output/';