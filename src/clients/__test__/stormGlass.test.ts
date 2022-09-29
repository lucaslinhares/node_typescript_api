import { StormGlass } from '@src/clients/stormGlass';
import axios from 'axios';
import stormGlassNormalized3HoursFixture from '@test/fixtures/stormglass_normalized_response_3_hours.json';
import stormGlassWeather3HoursFixture from '@test/fixtures/stormglass_weather_3_hours.json'

jest.mock('axios');

describe('StormGlass client', () => {

    const mockedAxios = axios as jest.Mocked< typeof axios >

    it(' deve retornar a previsão do tempo normalizado do serviço StormGlass',async () => {
        const lat = -33.792776;
        const lon = 151.1232123;
        
        mockedAxios.get.mockResolvedValue({data:stormGlassWeather3HoursFixture});

        
        const stormGlass = new StormGlass(mockedAxios);
        const response = await stormGlass.fetchPoints(lat, lon);
        expect(response).toEqual(stormGlassNormalized3HoursFixture)
    });

    it('deve excluir dados de pontos imcompletos', async () => {
        const lat = -33.792726;
        const lng = 151.289824;
        const incompleteResponse = {
          hours: [
            {
              windDirection: {
                noaa: 300,
              },
              time: '2020-04-26T00:00:00+00:00',
            },
          ],
        };
        mockedAxios.get.mockResolvedValue({ data: incompleteResponse });
    
        const stormGlass = new StormGlass(mockedAxios);
        const response = await stormGlass.fetchPoints(lat, lng);
    
        expect(response).toEqual([]);
      });
    
      it('deve receber um erro generico do StormGlass service quando a requisicao falha antes do serviço externo', async () => {
        const lat = -33.792726;
        const lng = 151.289824;
    
        mockedAxios.get.mockRejectedValue({ message: 'Network Error' });
    
        const stormGlass = new StormGlass(mockedAxios);
    
        await expect(stormGlass.fetchPoints(lat, lng)).rejects.toThrow(
          'Erro inesperado ao tentar acesso o StormGlass: Network Error'
        );
      });
    
      it('should get an StormGlassResponseError when the StormGlass service responds with error', async () => {
        const lat = -33.792726;
        const lng = 151.289824;
    
        class FakeAxiosError extends Error {
          constructor(public response: object) {
            super();
          }
        }
    
        mockedAxios.get.mockRejectedValue(
          new FakeAxiosError({
            status: 429,
            data: { errors: ['Rate Limit reached'] },
          })
        );
    
        const stormGlass = new StormGlass(mockedAxios);
    
        await expect(stormGlass.fetchPoints(lat, lng)).rejects.toThrow(
          'Unexpected error returned by the StormGlass service: Error: {"errors":["Rate Limit reached"]} Code: 429'
        );
      });
    });