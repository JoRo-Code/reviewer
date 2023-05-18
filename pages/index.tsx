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

  const handleTranslate = async () => {
    const maxInputLength = model === DEFAULT_MODEL ? 4000 : 12000;

    if (!inputCode) {
      alert('Please enter some text to be reviewed.');
      return;
    }

    if (inputCode.length > maxInputLength) {
      alert(
        `Please enter text less than ${maxInputLength} characters. You are currently at ${inputCode.length} characters.`,
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

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);

      code += chunkValue;

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
        <title>Reviewer</title>
        <meta
          name="description"
          content="Use AI to review text"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
        

      <div className="flex h-full min-h-screen flex-col items-center bg-[#0E1117] px-4 pb-20 text-neutral-200 sm:px-10">

        <div className="mt-10 flex flex-col items-center justify-center sm:mt-20">
          <div className="p-4">
            <Image src={Logo} alt="Logo" width={40} height={40} />
          </div>
          <div className="text-4xl font-bold">Feedback like never before</div>
        </div>

        <div className="mt-2 flex items-center space-x-2">

          <button
            className="w-[140px] cursor-pointer rounded-md bg-violet-500 px-4 py-2 font-bold hover:bg-violet-600 active:bg-violet-700"
            onClick={() => handleTranslate()}
            disabled={loading}
          >
            {loading ? 'Running...' : 'Run'}
          </button>
        </div>

        <div className="mt-2 text-center text-xs">
          {loading
            ? ''
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

      <Analytics/>
    </>
  );
}