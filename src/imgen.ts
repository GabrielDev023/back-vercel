import axios, { AxiosResponse } from "axios";

function generateRandomInt(A: number, B: number) {
  // Calcula um número aleatório entre 0 e 1
  const rand = Math.random();

  // Escala o número aleatório para o intervalo desejado (A até B)
  const randint = Math.floor(rand * (B - A + 1)) + A;

  return randint;
}

function createSession(_U: string) {
  // Generate random IP between range 13.104.0.0/14
  const FORWARDED_IP = `13.${generateRandomInt(104, 107)}.${generateRandomInt(
    0,
    255
  )}.${generateRandomInt(0, 255)}`;
  return axios.create({
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "pt-BR,pt;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      "Referrer-Policy": "origin-when-cross-origin",
      referrer: "https://www.bing.com/images/create/",
      origin: "https://www.bing.com",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
      "x-forwarded-for": FORWARDED_IP,
      cookie: `_U=${_U}`,

      "sec-ch-ua": `"Microsoft Edge";v="111", "Not(A:Brand";v="8", "Chromium";v="111"`,
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
    },
  });
}

export async function getCreateImageRequestId(_U: string, prompt: string) {
  const session = createSession(_U);
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://www.bing.com/images/create?q=${encodedPrompt}&rt=4&FORM=GENCRE`;
  console.log(url);
  const response = await session.post(url, {
    maxRedirects: 0,
    /*validateStatus: function (status: number) {
      return status >= 200 && status < 303;
    },*/
    timeout: 200000,
  });

  let redirectUrl = "";
  if (response.status >= 200 && response.status <= 302) {
    redirectUrl = response.request.res.responseUrl.replace("&nfy=1", "");
  } else {
    console.error(
      `ERROR: the status is ${response.status} instead of 302 or 200`
    );
    throw {
      message: "Falha ao tentar redirecionar URL",
      type: "RedirectErr",
    };
  }

  // console.log(response);
  console.log("redirect URL: ", redirectUrl);
  const requestId = redirectUrl.split("id=")[1];
  if (!requestId)
    throw {
      message: "Falha ao tentar obter id da requisição",
      type: "RequestIdErr",
    };

  await session.get(redirectUrl);

  /*return {
    pollingUrl: `https://www.bing.com/images/create/async/results/${requestId}?q=${encodedPrompt}`,
  };*/
  return {
    requestId,
  };
}

export async function getImgLinks(
  _U: string,
  prompt: string,
  _pollingUrl?: string
) {
  const session = createSession(_U);
  let pollingUrl = _pollingUrl;
  if (!pollingUrl) {
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://www.bing.com/images/create?q=${encodedPrompt}&rt=3&FORM=GENCRE`;
    console.log(url);
    const response = await session.post(url, {
      maxRedirects: 0,
      validateStatus: function (status: number) {
        return status >= 200 && status < 303;
      },
      timeout: 200000,
    });

    let redirectUrl = "";
    if (response.status == 200) {
      redirectUrl = response.request.res.responseUrl.replace("&nfy=1", "");
    } else if (response.status !== 302) {
      console.error(
        `ERROR: the status is ${response.status} instead of 302 or 200`
      );
      throw {
        message: "Falha ao tentar redirecionar URL",
        type: "RedirectErr",
      };
    }

    const requestId = redirectUrl.split("id=")[1];
    console.log("redirect URL: ", redirectUrl);
    await session.get(redirectUrl);

    pollingUrl = `https://www.bing.com/images/create/async/results/${requestId}?q=${encodedPrompt}`;
  }
  console.log("polling URL: ", pollingUrl);

  console.log("Waiting for results...");
  //const startWait = performance.now();
  let imagesResponse: AxiosResponse;

  while (true) {
    /*if (performance.now() - startWait > 300000) {
      throw new Error("Timeout error");
    }*/
    console.log(".", { end: "", flush: true });
    imagesResponse = await session.get(pollingUrl);
    if (imagesResponse.status !== 200) {
      throw {
        message: "Não foi possível obter resultados",
        type: "GetResultsErr",
      };
    }
    if (imagesResponse.data === "") {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      continue;
    } else {
      break;
    }
  }

  const { errorMessage } = imagesResponse.data;
  if (errorMessage) {
    switch (errorMessage) {
      case "Pending":
        throw {
          message:
            "Imagens bloqueadas por violarem as políticas de conteúdo do Bing",
          type: "BadImages",
        };
      case "Error in AtlaFederation ,":
        throw {
          message: "Erro possivelmente devido ao cookie _U ter expirado",
          type: "PossibleCookieErr",
          pollingUrl,
        };
      default:
        console.log(errorMessage);
        throw {
          message: "Falha desconhecida ao gerar imagem",
          type: "BingErr",
        };
    }
  }

  const imageLinks = imagesResponse.data
    .match(/src="([^"]+)"/g)
    .map((src: string) => src.slice(5, -1));
  const normalImageLinks: string[] = Array.from(
    new Set(imageLinks.map((link: string) => link.split("?w=")[0]))
  );

  const badImages = [
    "https://r.bing.com/rp/in-2zU3AJUdkgFe7ZKv19yPBHVs.png",
    "https://r.bing.com/rp/TX9QuO3WzcCJz1uaaSwQAz39Kb0.jpg",
  ];

  for (const im of normalImageLinks) {
    if (badImages.includes(im))
      throw {
        message:
          "Imagens bloqueadas por violarem as políticas de conteúdo do Bing",
        type: "BadImages",
      };
  }

  if (normalImageLinks.length === 0) {
    throw { message: "Nenhuma imagem gerada", type: "NoImages" };
  }

  console.log("done");
  return normalImageLinks;
}

export async function getRequestIdStatus(_U: string, requestId: string) {
  try {
    const session = createSession(_U);
    const pollingUrl = `https://www.bing.com/images/create/async/results/${requestId}`;
    const imagesResponse = await session.get(pollingUrl);

    if (imagesResponse.status !== 200)
      return {
        status: "error",
        message: "Não foi possível obter resultados",
        ids: null,
      };
    if (imagesResponse.data === "")
      return { status: "generating", message: "", ids: null };
    else {
      const imageLinks = imagesResponse.data
        .match(/src="([^"]+)"/g)
        .map((src: string) => src.slice(5, -1));
      const normalImageLinks: string[] = Array.from(
        new Set(imageLinks.map((link: string) => link.split("?w=")[0]))
      );

      const badImages = [
        "https://r.bing.com/rp/in-2zU3AJUdkgFe7ZKv19yPBHVs.png",
        "https://r.bing.com/rp/TX9QuO3WzcCJz1uaaSwQAz39Kb0.jpg",
      ];
      for (const im of normalImageLinks) {
        if (badImages.includes(im))
          return {
            status: "blocked",
            message:
              "Imagens bloqueadas por violarem as políticas de conteúdo do Bing",
          };
      }

      if (normalImageLinks.length === 0)
        return {
          status: "error",
          message: "Não foi possível obter resultados",
        };

      const filteredImageLinks = normalImageLinks.filter(
        (link) => !!link.match(/^https:\/\/.*\/id\/.*$/)
      );
      return {
        status: "ok",
        message: "",
        ids: filteredImageLinks.map((link) => link.split("/").at(-1)),
      };
    }
  } catch (err: any) {
    console.log(err);
    throw {
      status: "error",
      message:
        "Não foi possível obter resultados. Verifique se o cookie _U está correto e tente novamente",
    };
  }
}