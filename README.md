# Figma Creator — Estudo de SDD, MCP e Geração Assistida por IA

Este projeto é um estudo técnico e experimental voltado à criação de um fluxo de conversão de telas do Figma em código HTML e CSS, utilizando uma abordagem orientada por SDD — Software Design Document — e explorando o uso de MCP — Model Context Protocol — como fonte complementar de contexto visual para agentes de IA.

O objetivo principal não é criar uma ferramenta final de produção, mas investigar, validar e documentar uma arquitetura capaz de combinar geração determinística, refinamento assistido por IA e melhoria visual baseada em contexto do Figma.

## Objetivo do Projeto

O projeto tem como objetivo estudar como um sistema pode:

- Ler ou receber estruturas extraídas do Figma;
- Normalizar a árvore visual de uma tela;
- Gerar HTML e CSS de forma organizada e rastreável;
- Preservar metadados como `data-figma-id`;
- Usar IA para melhorar o código gerado;
- Usar MCP/Figma como fonte de contexto visual;
- Comparar versões geradas;
- Consolidar um resultado final antes da exportação.

## Contexto de Estudo

Este projeto foi desenvolvido como uma prova de conceito para explorar a aplicação prática de:

- SDD como guia incremental de desenvolvimento;
- Requisitos funcionais organizados por etapas;
- Geração determinística de HTML/CSS;
- Agent Runner no backend;
- Integração com IA generativa;
- Uso de MCP para ampliar o contexto disponível para agentes;
- Estratégias de merge entre código gerado por regras e código melhorado por IA.

## SDD — Software Design Document

O SDD é utilizado como documento central do projeto.

Ele descreve os requisitos funcionais, decisões técnicas, regras de geração, limitações conhecidas e evolução prevista do sistema.

A ideia é manter o desenvolvimento orientado por documentação, garantindo que cada incremento tenha um propósito claro e que o histórico das decisões seja preservado.

Principais pontos estudados no SDD:

- Extração e normalização de estrutura visual;
- Geração de HTML;
- Geração de CSS;
- Preview do resultado;
- Modos de geração, como `visual-first`;
- Uso de IA para melhoria do código;
- Uso de MCP/Figma como contexto visual;
- Agent Runner;
- Merge híbrido;
- Consolidação antes da exportação.

## MCP — Model Context Protocol

O MCP é estudado neste projeto como uma forma de fornecer contexto adicional para agentes de IA.

No cenário proposto, o MCP/Figma não substitui o parser, a normalização ou a geração base do sistema. Ele funciona como uma fonte complementar de contexto visual, ajudando a IA a compreender melhor o design original.

Fluxo conceitual:

```txt
Link do Figma
↓
Backend / Agent Runner
↓
Contexto MCP/Figma
↓
IA
↓
Versão candidata HTML/CSS
↓
Merge com código determinístico
↓
Código consolidado
