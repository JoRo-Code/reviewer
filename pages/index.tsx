import { APIKeyInput } from '@/components/APIKeyInput';
import { CodeBlock } from '@/components/CodeBlock';
import { HtmlBlock } from '@/components/HtmlBlock';
import { LanguageSelect } from '@/components/LanguageSelect';
import { ModelSelect } from '@/components/ModelSelect';
import { TextBlock } from '@/components/TextBlock';
import { OpenAIModel, TranslateBody } from '@/types/types';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Logo from '../public/logo.png';
import Image from "next/image";
import { ProgressBar } from 'react-loader-spinner';
import { InfoButton } from '@/components/InfoButton';
import { Button } from "@/components/ui/button"

import ReactGA from 'react-ga';
const TRACKING_ID = 'G-3E00BVHW0V';
ReactGA.initialize(TRACKING_ID);

function loader() {
  return (
    <div>
      <ProgressBar
        height="80"
        width="80"
        ariaLabel="loading"
        barColor="white"
        borderColor=""
      />
    </div>
  );
}

const loadingMessages = [
  "Polishing your perspective...",
  "Fueling your understanding...",
  "Sparkling your thoughts...",
  "Casting light on your text...",
  "Gathering wisdom from your words...",
  "Guiding you towards insight...",
  "Gleaning insights from your input...",
  "Enlightening moments ahead...",
  "Deepening your text comprehension...",
  "Bathing your words in wisdom...",
  "Decoding your thoughts...",
  "Brightening your knowledge...",
  "Enhancing clarity...",
  "Unfolding your ideas...",
  "Empowering your text...",
  "Lighting the way to feedback...",
  "Illuminating feedback in progress...",
  "Delving into your words...",
  "Clarifying your content...",
  "Kindling insights...",
  "Analyzing your text...",
  "Generating feedback...",
  "Reviewing your input...",
  "Assessing your submission...",
  "Preparing your review...",
  "Extracting insights...",
  "Evaluating your content...",
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export default function Home() {
  const DEFAULT_MODEL = 'gpt-3.5-turbo';
  const [inputLanguage, setInputLanguage] = useState<string>('JavaScript');
  const [outputLanguage, setOutputLanguage] = useState<string>('Python');
  const [inputCode, setInputCode] = useState<string>('');
  const [outputCode, setOutputCode] = useState<string>('');
  const [model, setModel] = useState<OpenAIModel>(DEFAULT_MODEL);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasTranslated, setHasTranslated] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState<string>(randomElement(loadingMessages));

  const handleTranslate = async () => {
    const maxInputLength = model === DEFAULT_MODEL ? 2000 : 12000;

    if (!inputCode) {
      alert('Please enter some text to be reviewed.');
      return;
    }

    if (inputCode.length > maxInputLength) {
      alert(
        `
        Currently only a maximum of ${maxInputLength} characters is supported!
                                We're working on it :D

                              You are at ${inputCode.length} characters.
        `,
      );
      return;
    }

    setLoading(true);
    setOutputCode('');

    const controller = new AbortController();

    const body: TranslateBody = {
      inputLanguage,
      outputLanguage,
      inputCode,
      model,
      apiKey,
    };

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setLoading(false);
      alert('Something went wrong.');
      return;
    }

    const data = response.body;

    if (!data) {
      setLoading(false);
      alert('Something went wrong.');
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let code = '';

    let i = 0;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);

      code += chunkValue;

      i++;
      if (i % 25 == 0) {
        setLoadingMessage(randomElement(loadingMessages))
      }

      setOutputCode((prevCode) => prevCode + chunkValue);
    }

    setLoading(false);
    setHasTranslated(true);
    copyToClipboard(code);
  };

  const copyToClipboard = (text: string) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);

    localStorage.setItem('apiKey', value);
  };

  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search);
  },[]);

  useEffect(() => {
    if (hasTranslated) {
      handleTranslate();
    }
  }, [outputLanguage]);

  useEffect(() => {
    const apiKey = localStorage.getItem('apiKey');

    if (apiKey) {
      setApiKey(apiKey);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Deepenlight: automate the text review process for free</title>
        <meta
          name="description"
          content="Use AI to review your text: Get insights and feedback instantly on your text. Let the computer do your tedious work!"
        />
        <meta
          name="keywords"
          content="AI, insights, enlightment, improve text, feedback, feedback generation, review, review process, review automation, automation, text review, text feedback, instant feedback, feedback program, review program, free feedback"
        />
        <link rel="canonical" href="https://deepenlight.com" />
        <meta
          property='og:title'
          content="Deepenlight - get feedback and insights on your written work instantly"
        />
        <meta
          property='og:description'
          content="Use AI to review your text: Get insights and feedback instantly on your text. Let the computer do your tedious work!"
        />
        <meta property='og:type' content="website"/>
        <meta property='og:url' content="https://deepenlight.com"/>

        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/favicon.ico" />
        <link rel="shortcut icon" href="/images/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png" />
      </Head>


      <div className="flex h-full min-h-screen flex-col items-center bg-[#0E1117] px-4 pb-20 text-neutral-200 sm:px-10">

        <div className="mt-10 flex flex-col items-center justify-center sm:mt-20">
          <div className="p-4">
            <Image src={Logo} alt="Logo" width={40} height={40} />
          </div>

          <div className="relative flex justify-center items-center h-full">
            <div className="text-4xl font-bold text-center relative">
              Feedback like never <span className="relative">before
                <div className="absolute top-[20%] right-[-20%] transform -translate-y-[50%]">
                  <InfoButton />
                </div>
              </span>
            </div>
          </div>






        </div>

        <div className="mt-2 flex items-center space-x-2">

          {loading ? loader() :

            <button
              className="w-[140px] cursor-pointer rounded-lg bg-white text-black font-extrabold border-0 py-2 px-6 focus:outline-none hover:bg-white rounded text-xl transition-all duration-200 ease-in-out transform hover:scale-110 disabled:opacity-50"
              onClick={() => handleTranslate()}
              disabled={loading}
            >
              {'Run'}
            </button>


          }
        </div>


        <div className="mt-2 text-center text-xs">
          {loading
            ? loadingMessage
            : hasTranslated
              ? 'Output copied to clipboard!'
              : 'Enter some text and click "Run"'}
        </div>

        <div className="mt-6 flex w-full max-w-[1200px] flex-col justify-between sm:flex-row sm:space-x-4">
          <div className="h-100 flex flex-col justify-center space-y-2 sm:w-2/4">
            <div className="text-center text-xl font-bold">Input</div>

            <TextBlock
              text={inputCode}
              editable={!loading}
              onChange={(value) => {
                setInputCode(value);
                setHasTranslated(false);
              }}
            />

          </div>
          <div className="mt-8 flex h-full flex-col justify-center space-y-2 sm:mt-0 sm:w-2/4">
            <div className="text-center text-xl font-bold">Output</div>

            <HtmlBlock html={outputCode} />

          </div>
        </div>
      </div>

      <Analytics />
    </>
  );
}