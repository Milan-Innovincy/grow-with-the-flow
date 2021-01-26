interface IResult {
    lng: {
        min?: number,
        max?: number,
        avg?: number,
    },
    lat: {
        min?: number,
        max?: number,
        avg?: number,
    },
}

export default class CoordinateCalculator {
     static calculateBounds(plots: any) {
        let result: IResult = {
            lng: {
                min: undefined,
                max: undefined,
                avg: undefined,
            },
            lat: {
                min: undefined,
                max: undefined,
                avg: undefined,
            }
        };

        plots.features.map((y: any) => {
            y.geometry.coordinates[0].map(([lng, lat]: [number, number]) => {
                if (!result.lng.min || (result.lng.min && result.lng.min > lng)) {
                    result.lng.min = lng;
                }
                if (!result.lng.max || (result.lng.max && result.lng.max < lng)) {
                    result.lng.max = lng;
                }
                if (!result.lat.min || (result.lat.min && result.lat.min > lat)) {
                    result.lat.min = lat;
                }
                if (!result.lat.max || (result.lat.max && result.lat.max < lat)) {
                    result.lat.max = lat;
                }
            })
        });

        if (!result.lng.min || !result.lng.max || !result.lat.min || !result.lat.max) {
            return result;
        }
        result.lng.avg = (result.lng.min + result.lng.max) / 2;
        result.lat.avg = (result.lat.min + result.lat.max) / 2;

        return result;
    }
}