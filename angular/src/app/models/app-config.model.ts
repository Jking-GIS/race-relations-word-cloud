export interface IAppConfig {
  env: {
    name: string;
  };
  portal: {
    url: string;
  };
  services: {
    survey: string;
  };
  items: {
    webMap: string;
  };
  text: {
    question: string;
  };
  auth: {
    appId: string;
  };
}
