import { InternalError } from "@src/util/errors/internal-error";
import { AxiosError, AxiosStatic } from "axios"

// Consumindo api do stormglass. Essas interfaces são para tipar os dados que vem no response.
// O arquivo test/fixtures/stormglass_weather_3_hours.json tem o exemplo de responde do stormGlass

export interface StormGlassPointSource {
    [key: string]: number;
}

export interface StormGlassPoint {
    time: string;
    readonly waveHeight: StormGlassPointSource;
    readonly waveDirection: StormGlassPointSource;
    readonly swellDirection: StormGlassPointSource;
    readonly swellHeight: StormGlassPointSource;
    readonly swellPeriod: StormGlassPointSource;
    readonly windDirection: StormGlassPointSource;
    readonly windSpeed: StormGlassPointSource;
}

export interface StormGlassForecastResponse {
    hours: StormGlassPoint[];
}

export interface ForecastPoint {
    time: string;
    waveHeight: number;
    waveDirection: number;
    swellDirection: number;
    swellHeight: number;
    swellPeriod: number;
    windDirection: number;
    windSpeed: number;
}

export class ClientRequestError extends InternalError{
    constructor(message: string){
        const internalMessage = 'Erro inesperado ao tentar acesso o StormGlass';
        super(`${internalMessage}: ${message}`);
        
    }

}

export class StormGlassResponseError extends InternalError {
    constructor(message: string) {
      const internalMessage =
        'Unexpected error returned by the StormGlass service';
      super(`${internalMessage}: ${message}`);
    }
  }

export class StormGlass{
    readonly stormGlassAPIParams =
        'swellDirection,swellHeight,swellPeriod,waveDirection,waveHeight,windDirection,windSpeed';
    readonly stormGlassAPISource = 'noaa';

    constructor(protected request: AxiosStatic){

    }

    public async fetchPoints(lat:number, lon:number): Promise<ForecastPoint[]> {

        try {

        const response =  await this.request.get<StormGlassForecastResponse>(
            'https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=${this.stormGlassAPIParams}&source=${this.stormGlassAPISource}',
            {
                headers: {
                    Autorizathion: 'fake-token',
                },
            }
            );

            return this.normalizeResponse(response.data)
        }
        catch (err: unknown) {
            if ((err as AxiosError).response && (err as AxiosError).response?.data) {
              throw new StormGlassResponseError(
                `Error: ${JSON.stringify((err as AxiosError).response?.data)} Code: ${
                  (err as AxiosError).response?.status
                }`
              );
            }
      
            throw new ClientRequestError((err as Error).message);
          }
    }

    private normalizeResponse(points: StormGlassForecastResponse): ForecastPoint[] {
        return points.hours.filter(this.isValidPoint.bind(this)).map((point) => ({
            swellDirection: point.swellDirection[this.stormGlassAPISource],
            swellHeight: point.swellHeight[this.stormGlassAPISource],
            swellPeriod: point.swellPeriod[this.stormGlassAPISource],
            time: point.time,
            waveDirection: point.waveDirection[this.stormGlassAPISource],
            waveHeight: point.waveHeight[this.stormGlassAPISource],
            windDirection: point.windDirection[this.stormGlassAPISource],
            windSpeed: point.windSpeed[this.stormGlassAPISource], 
        }));
    }

    // !! força o retorno ser boolean. Tem q ter todas as keys para passar, o Partial ajuda nisso
    private isValidPoint(point: Partial<StormGlassPoint>): boolean {
        return !!(
          point.time &&
          point.swellDirection?.[this.stormGlassAPISource] &&
          point.swellHeight?.[this.stormGlassAPISource] &&
          point.swellPeriod?.[this.stormGlassAPISource] &&
          point.waveDirection?.[this.stormGlassAPISource] &&
          point.waveHeight?.[this.stormGlassAPISource] &&
          point.windDirection?.[this.stormGlassAPISource] &&
          point.windSpeed?.[this.stormGlassAPISource]
        );
      }

}